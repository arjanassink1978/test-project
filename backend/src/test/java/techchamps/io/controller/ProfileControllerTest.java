package techchamps.io.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import techchamps.io.config.CorsConfig;
import techchamps.io.config.SecurityConfig;
import techchamps.io.dto.request.UpdateProfileRequest;
import techchamps.io.dto.response.AvatarUploadResponse;
import techchamps.io.dto.response.ProfileResponse;
import techchamps.io.service.ProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProfileController.class)
@Import({SecurityConfig.class, CorsConfig.class, ProfileControllerTest.TestSecurityConfig.class})
class ProfileControllerTest {

    @TestConfiguration
    static class TestSecurityConfig {
        @Bean
        UserDetailsService userDetailsService() {
            return username -> {
                throw new UsernameNotFoundException("No users in test context");
            };
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProfileService profileService;

    // --- GET /api/profile/{username}: happy path ---

    @Test
    void getProfile_whenUserExists_returns200WithProfile() throws Exception {
        ProfileResponse profile = createSampleProfileResponse();
        when(profileService.getProfile("user")).thenReturn(Optional.of(profile));

        mockMvc.perform(get("/api/profile/user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("user"))
                .andExpect(jsonPath("$.email").value("user@example.com"))
                .andExpect(jsonPath("$.displayName").value("Demo User"))
                .andExpect(jsonPath("$.bio").value("A short bio"))
                .andExpect(jsonPath("$.location").value("Amsterdam"));
    }

    // --- GET /api/profile/{username}: user not found ---

    @Test
    void getProfile_whenUserDoesNotExist_returns404() throws Exception {
        when(profileService.getProfile("nonexistent")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/profile/nonexistent"))
                .andExpect(status().isNotFound());
    }

    // --- GET /api/profile/{username}: returns JSON content type ---

    @Test
    void getProfile_whenUserExists_returnsJsonContentType() throws Exception {
        ProfileResponse profile = createSampleProfileResponse();
        when(profileService.getProfile("user")).thenReturn(Optional.of(profile));

        mockMvc.perform(get("/api/profile/user"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }

    // --- PUT /api/profile/{username}: happy path ---

    @Test
    void updateProfile_whenUserExists_returns200WithUpdatedProfile() throws Exception {
        ProfileResponse updated = new ProfileResponse(1L, "user@example.com", "user",
                "New Name", "New bio", "Berlin", null);
        when(profileService.updateProfile(eq("user"), any(UpdateProfileRequest.class)))
                .thenReturn(Optional.of(updated));

        UpdateProfileRequest request = new UpdateProfileRequest("New Name", "New bio", "Berlin");

        mockMvc.perform(put("/api/profile/user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("New Name"))
                .andExpect(jsonPath("$.bio").value("New bio"))
                .andExpect(jsonPath("$.location").value("Berlin"));
    }

    // --- PUT /api/profile/{username}: user not found ---

    @Test
    void updateProfile_whenUserDoesNotExist_returns404() throws Exception {
        when(profileService.updateProfile(eq("nonexistent"), any(UpdateProfileRequest.class)))
                .thenReturn(Optional.empty());

        UpdateProfileRequest request = new UpdateProfileRequest("Name", "Bio", "Loc");

        mockMvc.perform(put("/api/profile/nonexistent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    // --- PUT /api/profile/{username}: validation error - bio too long ---

    @Test
    void updateProfile_withBioTooLong_returns400() throws Exception {
        String longBio = "x".repeat(501);
        UpdateProfileRequest request = new UpdateProfileRequest("Name", longBio, "Loc");

        mockMvc.perform(put("/api/profile/user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // --- PUT /api/profile/{username}: validation error - displayName too long ---

    @Test
    void updateProfile_withDisplayNameTooLong_returns400() throws Exception {
        String longName = "x".repeat(101);
        UpdateProfileRequest request = new UpdateProfileRequest(longName, "Bio", "Loc");

        mockMvc.perform(put("/api/profile/user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // --- PUT /api/profile/{username}: validation error - location too long ---

    @Test
    void updateProfile_withLocationTooLong_returns400() throws Exception {
        String longLocation = "x".repeat(101);
        UpdateProfileRequest request = new UpdateProfileRequest("Name", "Bio", longLocation);

        mockMvc.perform(put("/api/profile/user")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // --- POST /api/profile/{username}/avatar: happy path ---

    @Test
    void uploadAvatar_whenUserExists_returns200WithAvatarResponse() throws Exception {
        AvatarUploadResponse response = new AvatarUploadResponse(
                "data:image/png;base64,abc123", "Avatar uploaded successfully");
        when(profileService.uploadAvatar(eq("user"), any())).thenReturn(Optional.of(response));

        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.png", "image/png", new byte[]{1, 2, 3});

        mockMvc.perform(multipart("/api/profile/user/avatar").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl").value("data:image/png;base64,abc123"))
                .andExpect(jsonPath("$.message").value("Avatar uploaded successfully"));
    }

    // --- POST /api/profile/{username}/avatar: user not found ---

    @Test
    void uploadAvatar_whenUserDoesNotExist_returns404() throws Exception {
        when(profileService.uploadAvatar(eq("nonexistent"), any())).thenReturn(Optional.empty());

        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.png", "image/png", new byte[]{1, 2, 3});

        mockMvc.perform(multipart("/api/profile/nonexistent/avatar").file(file))
                .andExpect(status().isNotFound());
    }

    // --- DELETE /api/profile/{username}/avatar: happy path ---

    @Test
    void deleteAvatar_whenUserExists_returns200WithProfile() throws Exception {
        ProfileResponse profile = createSampleProfileResponse();
        profile.setAvatarUrl(null);
        when(profileService.deleteAvatar("user")).thenReturn(Optional.of(profile));

        mockMvc.perform(delete("/api/profile/user/avatar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("user"))
                .andExpect(jsonPath("$.avatarUrl").isEmpty());
    }

    // --- DELETE /api/profile/{username}/avatar: user not found ---

    @Test
    void deleteAvatar_whenUserDoesNotExist_returns404() throws Exception {
        when(profileService.deleteAvatar("nonexistent")).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/profile/nonexistent/avatar"))
                .andExpect(status().isNotFound());
    }

    // --- helper ---

    private ProfileResponse createSampleProfileResponse() {
        return new ProfileResponse(1L, "user@example.com", "user",
                "Demo User", "A short bio", "Amsterdam",
                "https://api.dicebear.com/7.x/avataaars/svg?seed=user");
    }
}
