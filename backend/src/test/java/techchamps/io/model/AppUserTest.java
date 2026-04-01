package techchamps.io.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AppUserTest {

    // --- getRole() (kills EMPTY_RETURN on line 33) ---

    @Test
    void getRole_returnsCorrectRole() {
        AppUser user = new AppUser("alice", "secret", "USER");
        assertThat(user.getRole()).isEqualTo("USER");
    }

    @Test
    void getRole_returnsAdminRole() {
        AppUser user = new AppUser("admin", "secret", "ADMIN");
        assertThat(user.getRole()).isEqualTo("ADMIN");
    }

    @Test
    void getRole_isNotEmpty() {
        AppUser user = new AppUser("bob", "pass", "USER");
        assertThat(user.getRole()).isNotEmpty();
    }

    // --- getId() (kills LONG_RETURN 0L on line 30) ---

    @Test
    void getId_returnsNullBeforePersistence() {
        AppUser user = new AppUser("charlie", "pass", "USER");
        // Before JPA assigns an id, getId() returns null — not 0L
        assertThat(user.getId()).isNull();
    }

    // --- getUsername / getPassword sanity (supports DatabaseUserDetailsService coverage) ---

    @Test
    void getUsername_returnsCorrectUsername() {
        AppUser user = new AppUser("diana", "pass", "USER");
        assertThat(user.getUsername()).isEqualTo("diana");
    }
}
