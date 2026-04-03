package techchamps.io.config;

import techchamps.io.model.AppUser;
import techchamps.io.model.ForumCategory;
import techchamps.io.model.Role;
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
        // Seed user (USER role)
        if (userRepository.findByUsername("user").isEmpty()) {
            AppUser user = new AppUser("user@example.com", "user", passwordEncoder.encode("user1234"), Role.USER);
            user.setDisplayName("Demo User");
            user.setBio("Software developer and coffee enthusiast");
            user.setLocation("Amsterdam, Netherlands");
            user.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=user");
            userRepository.save(user);
        }

        // Seed moderator (MODERATOR role)
        if (userRepository.findByUsername("moderator").isEmpty()) {
            AppUser moderator = new AppUser("moderator@example.com", "moderator", passwordEncoder.encode("moderator1234"), Role.MODERATOR);
            moderator.setDisplayName("Forum Moderator");
            moderator.setBio("Keeping the forum clean and organized");
            moderator.setLocation("Amsterdam, Netherlands");
            moderator.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=moderator");
            userRepository.save(moderator);
        }

        // Seed admin (ADMIN role)
        if (userRepository.findByUsername("admin").isEmpty()) {
            AppUser admin = new AppUser("admin@example.com", "admin", passwordEncoder.encode("admin1234"), Role.ADMIN);
            admin.setDisplayName("Forum Admin");
            admin.setBio("Full control over the forum");
            admin.setLocation("Amsterdam, Netherlands");
            admin.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=admin");
            userRepository.save(admin);
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
