package techchamps.io.security;

import techchamps.io.model.AppUser;
import techchamps.io.repository.AppUserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DatabaseUserDetailsServiceTest {

    @Mock
    private AppUserRepository userRepository;

    @InjectMocks
    private DatabaseUserDetailsService service;

    // --- happy path: user found ---

    @Test
    void loadUserByUsername_withExistingUser_returnsUserDetails() {
        AppUser user = new AppUser("alice", "encodedPass", "USER");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));

        UserDetails details = service.loadUserByUsername("alice");

        assertThat(details.getUsername()).isEqualTo("alice");
        assertThat(details.getPassword()).isEqualTo("encodedPass");
    }

    // --- happy path: role mapped with ROLE_ prefix ---

    @Test
    void loadUserByUsername_mapsRoleWithPrefix() {
        AppUser user = new AppUser("alice", "encodedPass", "USER");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));

        UserDetails details = service.loadUserByUsername("alice");

        assertThat(details.getAuthorities())
                .extracting(a -> a.getAuthority())
                .containsExactly("ROLE_USER");
    }

    @Test
    void loadUserByUsername_adminRole_mapsCorrectly() {
        AppUser admin = new AppUser("admin", "encodedPass", "ADMIN");
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));

        UserDetails details = service.loadUserByUsername("admin");

        assertThat(details.getAuthorities())
                .extracting(a -> a.getAuthority())
                .containsExactly("ROLE_ADMIN");
    }

    // --- expected exception: user not found ---

    @Test
    void loadUserByUsername_withUnknownUser_throwsUsernameNotFoundException() {
        when(userRepository.findByUsername("nobody")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername("nobody"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("nobody");
    }

    // --- edge case: single authority only ---

    @Test
    void loadUserByUsername_returnsExactlyOneAuthority() {
        AppUser user = new AppUser("bob", "pass", "USER");
        when(userRepository.findByUsername("bob")).thenReturn(Optional.of(user));

        UserDetails details = service.loadUserByUsername("bob");

        assertThat(details.getAuthorities()).hasSize(1);
    }
}
