package techchamps.io.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class UserProfileTest {

    @Test
    void defaultConstructor_createsEmptyProfile() {
        UserProfile profile = new UserProfile();

        assertThat(profile.getId()).isNull();
        assertThat(profile.getUser()).isNull();
        assertThat(profile.getDisplayName()).isNull();
        assertThat(profile.getBio()).isNull();
        assertThat(profile.getLocation()).isNull();
        assertThat(profile.getWebsite()).isNull();
        assertThat(profile.getAvatarUrl()).isNull();
    }

    @Test
    void constructorWithUser_setsUser() {
        AppUser user = new AppUser("test@example.com", "testuser", "password", Role.USER);
        UserProfile profile = new UserProfile(user);

        assertThat(profile.getUser()).isEqualTo(user);
        assertThat(profile.getUser().getUsername()).isEqualTo("testuser");
    }

    @Test
    void settersAndGetters_workCorrectly() {
        UserProfile profile = new UserProfile();
        AppUser user = new AppUser("test@example.com", "testuser", "password", Role.USER);

        profile.setUser(user);
        profile.setDisplayName("Test User");
        profile.setBio("A test bio");
        profile.setLocation("Test City");
        profile.setWebsite("https://example.com");
        profile.setAvatarUrl("data:image/png;base64,abc123");

        assertThat(profile.getUser()).isEqualTo(user);
        assertThat(profile.getDisplayName()).isEqualTo("Test User");
        assertThat(profile.getBio()).isEqualTo("A test bio");
        assertThat(profile.getLocation()).isEqualTo("Test City");
        assertThat(profile.getWebsite()).isEqualTo("https://example.com");
        assertThat(profile.getAvatarUrl()).isEqualTo("data:image/png;base64,abc123");
    }
}
