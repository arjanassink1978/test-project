package techchamps.io.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AppUserTest {

    @Test
    void getRole_returnsCorrectRole() {
        AppUser user = new AppUser("alice", "secret", Role.USER);
        assertThat(user.getRole()).isEqualTo(Role.USER);
    }

    @Test
    void getRole_returnsAdminRole() {
        AppUser user = new AppUser("admin", "secret", Role.ADMIN);
        assertThat(user.getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    void getRole_isNotNull() {
        AppUser user = new AppUser("bob", "pass", Role.USER);
        assertThat(user.getRole()).isNotNull();
    }

    @Test
    void getId_returnsNullBeforePersistence() {
        AppUser user = new AppUser("charlie", "pass", Role.USER);
        assertThat(user.getId()).isNull();
    }

    @Test
    void getUsername_returnsCorrectUsername() {
        AppUser user = new AppUser("diana", "pass", Role.USER);
        assertThat(user.getUsername()).isEqualTo("diana");
    }
}
