package techchamps.io.config;

import techchamps.io.model.AppUser;
import techchamps.io.model.ForumCategory;
import techchamps.io.repository.ForumCategoryRepository;
import java.util.List;

import techchamps.io.repository.AppUserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ForumCategoryRepository forumCategoryRepository;

    public DataInitializer(AppUserRepository userRepository, PasswordEncoder passwordEncoder,
                            ForumCategoryRepository forumCategoryRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.forumCategoryRepository = forumCategoryRepository;
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

        // Seed forum categories
        if (forumCategoryRepository.count() == 0) {
            forumCategoryRepository.saveAll(List.of(
                new ForumCategory("Algemeen", "Algemene discussies", "\uD83D\uDCAC"),
                new ForumCategory("Technologie", "Tech nieuws en vragen", "\uD83D\uDCBB"),
                new ForumCategory("Off-topic", "Alles wat niet past", "\uD83C\uDFAF")
            ));
        }
    }
}
