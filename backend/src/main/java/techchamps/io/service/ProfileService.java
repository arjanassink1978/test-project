package techchamps.io.service;

import techchamps.io.dto.request.UpdateProfileRequest;
import techchamps.io.dto.response.AvatarUploadResponse;
import techchamps.io.dto.response.ProfileResponse;
import techchamps.io.model.AppUser;
import techchamps.io.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Optional;

@Service
public class ProfileService {

    private final AppUserRepository appUserRepository;

    public ProfileService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    public Optional<ProfileResponse> getProfile(String username) {
        return appUserRepository.findByUsername(username)
                .map(this::toProfileResponse);
    }

    public Optional<ProfileResponse> updateProfile(String username, UpdateProfileRequest request) {
        return appUserRepository.findByUsername(username)
                .map(user -> {
                    user.setDisplayName(request.getDisplayName());
                    user.setBio(request.getBio());
                    user.setLocation(request.getLocation());
                    AppUser saved = appUserRepository.save(user);
                    return toProfileResponse(saved);
                });
    }

    public Optional<AvatarUploadResponse> uploadAvatar(String username, MultipartFile file) throws IOException {
        return appUserRepository.findByUsername(username)
                .map(user -> {
                    try {
                        String contentType = file.getContentType();
                        byte[] bytes = file.getBytes();
                        String base64 = Base64.getEncoder().encodeToString(bytes);
                        String dataUri = "data:" + contentType + ";base64," + base64;
                        user.setAvatarUrl(dataUri);
                        appUserRepository.save(user);
                        return new AvatarUploadResponse(dataUri, "Avatar uploaded successfully");
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to read avatar file", e);
                    }
                });
    }

    public Optional<ProfileResponse> deleteAvatar(String username) {
        return appUserRepository.findByUsername(username)
                .map(user -> {
                    user.setAvatarUrl(null);
                    AppUser saved = appUserRepository.save(user);
                    return toProfileResponse(saved);
                });
    }

    private ProfileResponse toProfileResponse(AppUser user) {
        return new ProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getDisplayName(),
                user.getBio(),
                user.getLocation(),
                user.getAvatarUrl()
        );
    }
}
