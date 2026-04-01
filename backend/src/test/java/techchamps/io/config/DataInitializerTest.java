package techchamps.io.config;

import techchamps.io.model.AppUser;
import techchamps.io.repository.AppUserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ApplicationArguments applicationArguments;

    @InjectMocks
    private DataInitializer dataInitializer;

    // --- happy path: user does not exist yet, should be created ---

    @Test
    void run_whenUserDoesNotExist_savesNewUser() throws Exception {
        when(userRepository.findByUsername("user")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("user1234")).thenReturn("encodedPassword");

        dataInitializer.run(applicationArguments);

        verify(userRepository, times(1)).save(any(AppUser.class));
    }

    // --- happy path: saved user has correct username ---

    @Test
    void run_whenUserDoesNotExist_savesUserWithCorrectUsername() throws Exception {
        when(userRepository.findByUsername("user")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("user1234")).thenReturn("encodedPassword");

        dataInitializer.run(applicationArguments);

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getUsername()).isEqualTo("user");
    }

    // --- happy path: saved user has encoded password ---

    @Test
    void run_whenUserDoesNotExist_savesUserWithEncodedPassword() throws Exception {
        when(userRepository.findByUsername("user")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("user1234")).thenReturn("encodedPassword");

        dataInitializer.run(applicationArguments);

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getPassword()).isEqualTo("encodedPassword");
    }

    // --- happy path: saved user has correct role ---

    @Test
    void run_whenUserDoesNotExist_savesUserWithUserRole() throws Exception {
        when(userRepository.findByUsername("user")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("user1234")).thenReturn("encodedPassword");

        dataInitializer.run(applicationArguments);

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getRole()).isEqualTo("USER");
    }

    // --- edge case: user already exists, no save should happen ---

    @Test
    void run_whenUserAlreadyExists_doesNotSaveAgain() throws Exception {
        AppUser existing = new AppUser("user", "alreadyEncoded", "USER");
        when(userRepository.findByUsername("user")).thenReturn(Optional.of(existing));

        dataInitializer.run(applicationArguments);

        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
    }
}
