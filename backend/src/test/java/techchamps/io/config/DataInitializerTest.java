package techchamps.io.config;

import techchamps.io.model.AppUser;
import techchamps.io.model.Role;
import techchamps.io.repository.AppUserRepository;
import techchamps.io.repository.ForumCategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataInitializerTest {

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ForumCategoryRepository forumCategoryRepository;

    @Mock
    private ApplicationArguments applicationArguments;

    @InjectMocks
    private DataInitializer dataInitializer;

    @BeforeEach
    void setupDefaultMocks() {
        when(userRepository.findByUsername("user")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("moderator")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("admin")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(forumCategoryRepository.count()).thenReturn(3L);
    }

    @Test
    void run_whenNoUsersExist_savesAllThreeUsers() throws Exception {
        dataInitializer.run(applicationArguments);

        verify(userRepository, times(3)).save(any(AppUser.class));
    }

    @Test
    void run_whenUserDoesNotExist_savesUserWithCorrectUsername() throws Exception {
        dataInitializer.run(applicationArguments);

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository, times(3)).save(captor.capture());
        List<AppUser> saved = captor.getAllValues();
        assertThat(saved).extracting(AppUser::getUsername)
                .contains("user", "moderator", "admin");
    }

    @Test
    void run_whenUserDoesNotExist_savesUserWithEncodedPassword() throws Exception {
        dataInitializer.run(applicationArguments);

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository, times(3)).save(captor.capture());
        AppUser regularUser = captor.getAllValues().stream()
                .filter(u -> "user".equals(u.getUsername()))
                .findFirst().orElseThrow();
        assertThat(regularUser.getPassword()).isEqualTo("encodedPassword");
    }

    @Test
    void run_seedsUserWithUserRole() throws Exception {
        dataInitializer.run(applicationArguments);

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository, times(3)).save(captor.capture());
        AppUser regularUser = captor.getAllValues().stream()
                .filter(u -> "user".equals(u.getUsername()))
                .findFirst().orElseThrow();
        assertThat(regularUser.getRole()).isEqualTo(Role.USER);
    }

    @Test
    void run_seedsModeratorWithModeratorRole() throws Exception {
        dataInitializer.run(applicationArguments);

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository, times(3)).save(captor.capture());
        AppUser mod = captor.getAllValues().stream()
                .filter(u -> "moderator".equals(u.getUsername()))
                .findFirst().orElseThrow();
        assertThat(mod.getRole()).isEqualTo(Role.MODERATOR);
    }

    @Test
    void run_seedsAdminWithAdminRole() throws Exception {
        dataInitializer.run(applicationArguments);

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository, times(3)).save(captor.capture());
        AppUser admin = captor.getAllValues().stream()
                .filter(u -> "admin".equals(u.getUsername()))
                .findFirst().orElseThrow();
        assertThat(admin.getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    void run_whenUserDoesNotExist_savesUserWithProfileFields() throws Exception {
        dataInitializer.run(applicationArguments);

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository, times(3)).save(captor.capture());
        AppUser saved = captor.getAllValues().stream()
                .filter(u -> "user".equals(u.getUsername()))
                .findFirst().orElseThrow();
        assertThat(saved.getDisplayName()).isEqualTo("Demo User");
        assertThat(saved.getBio()).isEqualTo("Software developer and coffee enthusiast");
        assertThat(saved.getLocation()).isEqualTo("Amsterdam, Netherlands");
        assertThat(saved.getAvatarUrl()).isEqualTo("https://api.dicebear.com/7.x/avataaars/svg?seed=user");
    }

    @Test
    void run_whenUserAlreadyExists_doesNotSaveUser() throws Exception {
        AppUser existing = new AppUser("user", "alreadyEncoded", Role.USER);
        when(userRepository.findByUsername("user")).thenReturn(Optional.of(existing));

        dataInitializer.run(applicationArguments);

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository, atMost(2)).save(captor.capture());
        assertThat(captor.getAllValues()).extracting(AppUser::getUsername)
                .doesNotContain("user");
    }

    @Test
    void run_whenNoCategoriesExist_seedsCategories() throws Exception {
        when(forumCategoryRepository.count()).thenReturn(0L);

        dataInitializer.run(applicationArguments);

        verify(forumCategoryRepository).saveAll(anyList());
    }

    @Test
    void run_whenCategoriesExist_doesNotSeedAgain() throws Exception {
        when(forumCategoryRepository.count()).thenReturn(3L);

        dataInitializer.run(applicationArguments);

        verify(forumCategoryRepository, never()).saveAll(anyList());
    }
}
