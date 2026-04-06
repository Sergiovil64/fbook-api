$version: "2"

namespace com.fbook.userprofile

// uuid identifier for the user profile
@pattern("^[a-zA-Z0-9_-]{1,128}$")
string UserProfileId

structure UserProfile {
    @required
    id: UserProfileId

    @required
    displayName: String

    bio: String

    @required
    email: String
}

list UserProfileList {
    member: UserProfile
}

// Create User Profile

structure CreateUserProfileInput {
    @required
    displayName: String

    bio: String

    @required
    email: String
}

structure CreateUserProfileOutput {
    @httpPayload
    profile: UserProfile
}

@tags(["UserProfiles"])
@http(method: "POST", uri: "/v1/user-profiles", code: 201)
operation CreateUserProfile {
    input: CreateUserProfileInput
    output: CreateUserProfileOutput
}

// Read User Profile

structure GetUserProfileInput {
    @required
    @httpLabel
    id: UserProfileId
}

structure GetUserProfileOutput {
    @httpPayload
    profile: UserProfile
}

@readonly
@tags(["UserProfiles"])
@http(method: "GET", uri: "/v1/user-profiles/{id}", code: 200)
operation GetUserProfile {
    input: GetUserProfileInput
    output: GetUserProfileOutput
}

// Update User Profile

structure UpdateUserProfileInput {
    @required
    @httpLabel
    id: UserProfileId

    displayName: String

    bio: String
}

structure UpdateUserProfileOutput {
    @httpPayload
    profile: UserProfile
}

@idempotent
@tags(["UserProfiles"])
@http(method: "PUT", uri: "/v1/user-profiles/{id}", code: 200)
operation UpdateUserProfile {
    input: UpdateUserProfileInput
    output: UpdateUserProfileOutput
}

// Delete User Profile

structure DeleteUserProfileInput {
    @required
    @httpLabel
    id: UserProfileId
}

@idempotent
@tags(["UserProfiles"])
@http(method: "DELETE", uri: "/v1/user-profiles/{id}", code: 204)
operation DeleteUserProfile {
    input: DeleteUserProfileInput
    output: Unit
}

// List User Profiles

structure ListUserProfilesInput {
    @httpQuery("nextToken")
    nextToken: String

    @httpQuery("maxResults")
    maxResults: Integer
}

structure ListUserProfilesOutput {
    items: UserProfileList

    nextToken: String
}

@readonly
@tags(["UserProfiles"])
@http(method: "GET", uri: "/v1/user-profiles", code: 200)
operation ListUserProfiles {
    input: ListUserProfilesInput
    output: ListUserProfilesOutput
}

// User Profile Resource

resource UserProfileResource {
    identifiers: { id: UserProfileId }

    create: CreateUserProfile

    read: GetUserProfile

    update: UpdateUserProfile

    delete: DeleteUserProfile

    list: ListUserProfiles
}
