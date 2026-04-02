package techchamps.io.repository;

import techchamps.io.model.ForumCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ForumCategoryRepository extends JpaRepository<ForumCategory, Long> {
}
