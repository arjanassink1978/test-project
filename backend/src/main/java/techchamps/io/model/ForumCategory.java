package techchamps.io.model;

import jakarta.persistence.*;

@Entity
@Table(name = "forum_categories")
public class ForumCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    private String icon;

    public ForumCategory() {}

    public ForumCategory(String name, String description, String icon) {
        this.name = name;
        this.description = description;
        this.icon = icon;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getIcon() { return icon; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setIcon(String icon) { this.icon = icon; }
}
