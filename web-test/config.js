// Configuración de la UI de prueba — apunta al backend real desplegado en AWS.
// Actualizar estos 4 valores si se vuelve a desplegar el stack (outputs de fbook-cdk):
//   apiBaseUrl -> FbookAlbStack.AlbDnsName   (con http://, sin barra final)
//   region     -> región del User Pool
//   userPoolId -> FbookCdkStack.UserPoolId
//   clientId   -> FbookCdkStack.UserPoolClientId
window.FBOOK_CONFIG = {
  apiBaseUrl: 'http://FbookA-Fbook-a8nye1KDrhU6-1555642261.us-east-1.elb.amazonaws.com',
  cognito: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_4mMRXn9LR',
    clientId: 'io2c2b0bvi4l3263ir9ljrs9j',
  },
};
