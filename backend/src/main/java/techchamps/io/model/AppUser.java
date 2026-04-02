package techchamps.io.model;

import jakarta.persistence.*;

@Entity
@Table(name = "app_users")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role;

    @Column(name = "display_name")
    private String displayName;

    @Column(length = 500)
    private String bio;

    private String location;

    @Column(name = "avatar_url", columnDefinition = "CLOB")
    private String avatarUrl;

    public AppUser() {}

    public AppUser(String username, String password, String role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }

    public AppUser(String email, String username, String password, String role) {
        this.email = email;
        this.username = username;
        this.password = password;
        this.role = role;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public String getRole() { return role; }
    public String getDisplayName() { return displayName; }
    public String getBio() { return bio; }
    public String getLocation() { return location; }
    public String getAvatarUrl() { return avatarUrl; }

    public void setEmail(String email) { this.email = email; }
    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }
    public void setRole(String role) { this.role = role; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public void setBio(String bio) { this.bio = bio; }
    public void setLocation(String location) { this.location = location; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
