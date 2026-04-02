package techchamps.io.controller;

import techchamps.io.dto.request.UpdateProfileRequest;
import techchamps.io.dto.response.AvatarUploadResponse;
import techchamps.io.dto.response.ProfileResponse;
import techchamps.io.service.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/profile")
@Tag(name = "Profile", description = "Endpoints for viewing and managing user profiles")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/{username}")
    @Operation(summary = "Get profile", description = "Retrieve a user profile by username")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Profile found",
            content = @Content(schema = @Schema(implementation = ProfileResponse.class))),
        @ApiResponse(responseCode = "404", description = "User not found",
            content = @Content)
    })
    public ResponseEntity<ProfileResponse> getProfile(@PathVariable String username) {
        return profileService.getProfile(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{username}")
    @Operation(summary = "Update profile", description = "Update a user's profile fields (displayName, bio, location)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Profile updated successfully",
            content = @Content(schema = @Schema(implementation = ProfileResponse.class))),
        @ApiResponse(responseCode = "404", description = "User not found",
            content = @Content)
    })
    public ResponseEntity<ProfileResponse> updateProfile(
            @PathVariable String username,
            @Valid @RequestBody UpdateProfileRequest request) {
        return profileService.updateProfile(username, request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping(value = "/{username}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload avatar", description = "Upload an avatar image for a user (stored as base64)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Avatar uploaded successfully",
            content = @Content(schema = @Schema(implementation = AvatarUploadResponse.class))),
        @ApiResponse(responseCode = "404", description = "User not found",
            content = @Content)
    })
    public ResponseEntity<AvatarUploadResponse> uploadAvatar(
            @PathVariable String username,
            @RequestParam("file") MultipartFile file) throws IOException {
        return profileService.uploadAvatar(username, file)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{username}/avatar")
    @Operation(summary = "Delete avatar", description = "Remove a user's avatar image")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Avatar removed successfully",
            content = @Content(schema = @Schema(implementation = ProfileResponse.class))),
        @ApiResponse(responseCode = "404", description = "User not found",
            content = @Content)
    })
    public ResponseEntity<ProfileResponse> deleteAvatar(@PathVariable String username) {
        return profileService.deleteAvatar(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
