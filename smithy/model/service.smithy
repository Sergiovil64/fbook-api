$version: "2"

namespace com.fbook.services

use aws.protocols#restJson1
use com.fbook.userprofile#CreateUserProfile
use com.fbook.userprofile#DeleteUserProfile
use com.fbook.userprofile#GetUserProfile
use com.fbook.userprofile#ListUserProfiles
use com.fbook.userprofile#UpdateUserProfile

@restJson1
service ApiService {
    version: "2026-03-25"

    operations: [
        CreateUserProfile
        GetUserProfile
        UpdateUserProfile
        DeleteUserProfile
        ListUserProfiles
    ]
}
