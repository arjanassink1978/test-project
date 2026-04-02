package techchamps.io.service;

import techchamps.io.dto.request.UpdateProfileRequest;
import techchamps.io.dto.response.AvatarUploadResponse;
import techchamps.io.dto.response.ProfileResponse;
import techchamps.io.model.AppUser;
import techchamps.io.repository.AppUserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @InjectMocks
    private ProfileService profileService;

    // --- getProfile: happy path ---

    @Test
    void getProfile_whenUserExists_returnsProfileResponse() {
        AppUser user = createSampleUser();
        when(appUserRepository.findByUsername("user")).thenReturn(Optional.of(user));

        Optional<ProfileResponse> result = profileService.getProfile("user");

        assertThat(result).isPresent();
        assertThat(result.get().getUsername()).isEqualTo("user");
        assertThat(result.get().getEmail()).isEqualTo("user@example.com");
        assertThat(result.get().getDisplayName()).isEqualTo("Demo User");
        assertThat(result.get().getBio()).isEqualTo("A short bio");
        assertThat(result.get().getLocation()).isEqualTo("Amsterdam");
    }

    // --- getProfile: user not found ---

    @Test
    void getProfile_whenUserDoesNotExist_returnsEmpty() {
        when(appUserRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        Optional<ProfileResponse> result = profileService.getProfile("nonexistent");

        assertThat(result).isEmpty();
    }

    // --- getProfile: includes avatarUrl ---

    @Test
    void getProfile_whenUserHasAvatar_returnsAvatarUrl() {
        AppUser user = createSampleUser();
        user.setAvatarUrl("data:image/png;base64,abc123");
        when(appUserRepository.findByUsername("user")).thenReturn(Optional.of(user));

        Optional<ProfileResponse> result = profileService.getProfile("user");

        assertThat(result).isPresent();
        assertThat(result.get().getAvatarUrl()).isEqualTo("data:image/png;base64,abc123");
    }

    // --- updateProfile: happy path ---

    @Test
    void updateProfile_whenUserExists_updatesAndReturnsProfile() {
        AppUser user = createSampleUser();
        when(appUserRepository.findByUsername("user")).thenReturn(Optional.of(user));
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateProfileRequest request = new UpdateProfileRequest("New Name", "New bio", "Berlin");
        Optional<ProfileResponse> result = profileService.updateProfile("user", request);

        assertThat(result).isPresent();
        assertThat(result.get().getDisplayName()).isEqualTo("New Name");
        assertThat(result.get().getBio()).isEqualTo("New bio");
        assertThat(result.get().getLocation()).isEqualTo("Berlin");
        verify(appUserRepository).save(any(AppUser.class));
    }

    // --- updateProfile: user not found ---

    @Test
    void updateProfile_whenUserDoesNotExist_returnsEmpty() {
        when(appUserRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        UpdateProfileRequest request = new UpdateProfileRequest("Name", "Bio", "Loc");
        Optional<ProfileResponse> result = profileService.updateProfile("nonexistent", request);

        assertThat(result).isEmpty();
        verify(appUserRepository, never()).save(any());
    }

    // --- updateProfile: partial update with nulls ---

    @Test
    void updateProfile_withNullFields_setsFieldsToNull() {
        AppUser user = createSampleUser();
        when(appUserRepository.findByUsername("user")).thenReturn(Optional.of(user));
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateProfileRequest request = new UpdateProfileRequest(null, null, null);
        Optional<ProfileResponse> result = profileService.updateProfile("user", request);

        assertThat(result).isPresent();
        assertThat(result.get().getDisplayName()).isNull();
        assertThat(result.get().getBio()).isNull();
        assertThat(result.get().getLocation()).isNull();
    }

    // --- uploadAvatar: happy path ---

    @Test
    void uploadAvatar_whenUserExists_returnsAvatarResponse() throws IOException {
        AppUser user = createSampleUser();
        when(appUserRepository.findByUsername("user")).thenReturn(Optional.of(user));
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        MultipartFile file = mock(MultipartFile.class);
        when(file.getContentType()).thenReturn("image/png");
        when(file.getBytes()).thenReturn(new byte[]{1, 2, 3});

        Optional<AvatarUploadResponse> result = profileService.uploadAvatar("user", file);

        assertThat(result).isPresent();
        assertThat(result.get().getAvatarUrl()).startsWith("data:image/png;base64,");
        assertThat(result.get().getMessage()).isEqualTo("Avatar uploaded successfully");
        verify(appUserRepository).save(any(AppUser.class));
    }

    // --- uploadAvatar: user not found ---

    @Test
    void uploadAvatar_whenUserDoesNotExist_returnsEmpty() throws IOException {
        when(appUserRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        MultipartFile file = mock(MultipartFile.class);
        Optional<AvatarUploadResponse> result = profileService.uploadAvatar("nonexistent", file);

        assertThat(result).isEmpty();
        verify(appUserRepository, never()).save(any());
    }

    // --- deleteAvatar: happy path ---

    @Test
    void deleteAvatar_whenUserExists_removesAvatarAndReturnsProfile() {
        AppUser user = createSampleUser();
        user.setAvatarUrl("data:image/png;base64,abc");
        when(appUserRepository.findByUsername("user")).thenReturn(Optional.of(user));
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        Optional<ProfileResponse> result = profileService.deleteAvatar("user");

        assertThat(result).isPresent();
        assertThat(result.get().getAvatarUrl()).isNull();
        verify(appUserRepository).save(any(AppUser.class));
    }

    // --- deleteAvatar: user not found ---

    @Test
    void deleteAvatar_whenUserDoesNotExist_returnsEmpty() {
        when(appUserRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        Optional<ProfileResponse> result = profileService.deleteAvatar("nonexistent");

        assertThat(result).isEmpty();
        verify(appUserRepository, never()).save(any());
    }

    // --- helper ---

    private AppUser createSampleUser() {
        AppUser user = new AppUser("user@example.com", "user", "encodedPassword", "USER");
        user.setDisplayName("Demo User");
        user.setBio("A short bio");
        user.setLocation("Amsterdam");
        return user;
    }
}
