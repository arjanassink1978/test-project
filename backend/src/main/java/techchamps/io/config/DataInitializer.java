package techchamps.io.config;

import techchamps.io.model.AppUser;
import techchamps.io.repository.AppUserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(AppUserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.findByUsername("user").isEmpty()) {
            AppUser user = new AppUser("user@example.com", "user", passwordEncoder.encode("user1234"), "USER");
            user.setDisplayName("Demo User");
            user.setBio("Software developer and coffee enthusiast");
            user.setLocation("Amsterdam, Netherlands");
            user.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=user");
            userRepository.save(user);
        }
    }
}
