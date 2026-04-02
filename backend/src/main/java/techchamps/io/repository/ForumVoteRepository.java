package techchamps.io.repository;

import techchamps.io.model.ForumVote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ForumVoteRepository extends JpaRepository<ForumVote, Long> {

    Optional<ForumVote> findByVoterUsernameAndPostIdAndPostType(
            String username, Long postId, String postType);
}
