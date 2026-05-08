import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException, OnModuleInit } from '@nestjs/common';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminDeleteUserCommand,
  AdminAddUserToGroupCommand,
  MessageActionType,
} from '@aws-sdk/client-cognito-identity-provider';
import type { components } from '@api';
import { randomUUID } from 'crypto';

type Usuario = components['schemas']['Usuario'];
type CreateInput = components['schemas']['CreateUsuarioRequestContent'];
type UpdateInput = components['schemas']['UpdateUsuarioRequestContent'];
type ListOutput = components['schemas']['ListUsuariosResponseContent'];

const TABLE = process.env.TABLE_NAME ?? 'Usuarios';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;

@Injectable()
export class UsuariosService implements OnModuleInit {
  private readonly cognitoClient: CognitoIdentityProviderClient;

  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly dynamoClient: DynamoDBDocumentClient,
  ) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
    });
  }

  async onModuleInit() {
    try {
      await this.dynamoClient.send(new DescribeTableCommand({ TableName: TABLE }));
    } catch (err: any) {
      if (err?.name === 'ResourceNotFoundException') {
        await this.dynamoClient.send(
          new CreateTableCommand({
            TableName: TABLE,
            AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
            KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
            BillingMode: 'PAY_PER_REQUEST',
          }),
        );
      } else {
        throw err;
      }
    }
  }

  async create(body: CreateInput): Promise<Usuario> {
    // 1. Register in Cognito
    try {
      await this.cognitoClient.send(new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: body.correo,
        MessageAction: MessageActionType.SUPPRESS,
        UserAttributes: [
          { Name: 'email', Value: body.correo },
          { Name: 'name', Value: body.nombre },
          { Name: 'email_verified', Value: 'true' },
        ],
      }));
      await this.cognitoClient.send(new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: body.correo,
        Password: body.password,
        Permanent: true,
      }));
      await this.cognitoClient.send(new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: body.correo,
        GroupName: 'user',
      }));
    } catch (err: any) {
      if (err?.name === 'UsernameExistsException') {
        throw new ConflictException(`El correo ${body.correo} ya está registrado`);
      }
      throw err;
    }

    // 2. Persist profile in DynamoDB (password not stored)
    const usuario: Usuario = {
      id: randomUUID(),
      nombre: body.nombre,
      correo: body.correo,
      fechaRegistro: Date.now(),
    };
    await this.dynamoClient.send(new PutCommand({ TableName: TABLE, Item: usuario }));
    return usuario;
  }

  async findOne(id: string): Promise<Usuario> {
    const result = await this.dynamoClient.send(
      new GetCommand({ TableName: TABLE, Key: { id } }),
    );
    if (!result.Item) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }
    return result.Item as Usuario;
  }

  async update(id: string, body: UpdateInput): Promise<Usuario> {
    await this.findOne(id);

    const expressions: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = {};

    if (body.nombre !== undefined) {
      expressions.push('#nombre = :nombre');
      names['#nombre'] = 'nombre';
      values[':nombre'] = body.nombre;
    }
    if (body.correo !== undefined) {
      expressions.push('#correo = :correo');
      names['#correo'] = 'correo';
      values[':correo'] = body.correo;
    }

    if (expressions.length === 0) {
      throw new BadRequestException('Debes proporcionar al menos un campo para actualizar');
    }

    const result = await this.dynamoClient.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { id },
        UpdateExpression: `SET ${expressions.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      }),
    );
    return result.Attributes as Usuario;
  }

  async remove(id: string): Promise<void> {
    const usuario = await this.findOne(id);
    // Delete from Cognito
    await this.cognitoClient.send(new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: usuario.correo,
    })).catch(() => { /* ignore if not found in Cognito */ });
    await this.dynamoClient.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
  }

  async findAll(nextToken?: string, maxResults?: number): Promise<ListOutput> {
    const result = await this.dynamoClient.send(
      new ScanCommand({
        TableName: TABLE,
        Limit: maxResults ? Number(maxResults) : undefined,
        ExclusiveStartKey: nextToken
          ? JSON.parse(Buffer.from(nextToken, 'base64').toString('utf-8'))
          : undefined,
      }),
    );
    return {
      items: (result.Items ?? []) as Usuario[],
      nextToken: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined,
    };
  }
}
