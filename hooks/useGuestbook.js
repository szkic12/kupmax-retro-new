import { useState, useEffect } from 'react';

/**
 * Hook do zarządzania gośćcem przez REST API
 */
export function useGuestbook() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastCreatedEntry, setLastCreatedEntry] = useState(null);

  /**
   * Dodaj wpis do gośćca przez REST API
   */
  const addGuestbookPost = async ({ nickname, message, email, productRef = null }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname,
          message,
          email,
          productRef
        })
      });

      const result = await response.json();

      if (result.success) {
        setLastCreatedEntry(result.entry);
        return {
          success: true,
          data: result.entry,
          id: result.entry.id,
          wordpressSuccess: result.wordpressSuccess,
          note: result.note
        };
      } else {
        setError(result.error);
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Błąd podczas dodawania wpisu:', error);
      setError(error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Dodaj komentarz do istniejącego posta
   */
  const addComment = async ({ postId, authorName, authorEmail, content }) => {
    try {
      const result = await createComment({
        variables: {
          input: {
            clientMutationId: `comment-${Date.now()}`,
            commentOn: postId,
            content: content,
            author: authorName,
            authorEmail: authorEmail,
            status: 'HOLD' // Komentarz czeka na moderację
          }
        }
      });

      return {
        success: true,
        data: result.data?.createComment?.comment,
        id: result.data?.createComment?.comment?.databaseId
      };
    } catch (error) {
      console.error('Błąd podczas dodawania komentarza:', error);
      return {
        success: false,
        error: error.message,
        graphQLErrors: error.graphQLErrors
      };
    }
  };

  /**
   * Dodaj wpis do gośćca jako custom post type
   * (użyj tej funkcji jeśli masz dedykowany CPT dla gośćca)
   */
  const addGuestbookCustomEntry = async ({ nickname, message, email, productRef = null }) => {
    try {
      const result = await createGuestbookEntry({
        variables: {
          input: {
            clientMutationId: `guestbook-cpt-${Date.now()}`,
            title: nickname,
            status: 'PENDING',
            guestbookFields: {
              nickname: nickname,
              message: message,
              email: email,
              productRef: productRef,
              isApproved: false
            }
          }
        },
        refetchQueries: [{ query: GET_GUESTBOOK_ENTRIES }]
      });

      return {
        success: true,
        data: result.data?.createGuestbookEntry?.guestbookEntry,
        id: result.data?.createGuestbookEntry?.guestbookEntry?.databaseId
      };
    } catch (error) {
      console.error('Błąd podczas dodawania wpisu CPT:', error);
      return {
        success: false,
        error: error.message,
        graphQLErrors: error.graphQLErrors
      };
    }
  };

  return {
    // Funkcje do dodawania
    addGuestbookPost,
    addComment,
    addGuestbookCustomEntry,
    
    // Stany loading
    isLoading,
    
    // Błędy
    error,
    
    // Dane z odpowiedzi
    lastCreatedEntry
  };
}

/**
 * Hook do pobierania wpisów z gośćca
 */
export function useGuestbookEntries(options = {}) {
  const { first = 10 } = options;
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/guestbook?limit=${first}`);
      const result = await response.json();

      if (result.success) {
        setEntries(result.entries || []);
        setHasNextPage(result.entries && result.entries.length >= first);
      } else {
        setError(result.error || 'Failed to fetch entries');
      }
    } catch (err) {
      console.error('Error fetching guestbook entries:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    // Prosta implementacja - w przyszłości można dodać paginację
    await fetchEntries();
  };

  const refetch = async () => {
    await fetchEntries();
  };

  // Automatyczne pobieranie przy pierwszym renderze
  useEffect(() => {
    fetchEntries();
  }, []);

  return {
    entries,
    loading,
    error,
    loadMore,
    refetch,
    hasNextPage
  };
}

/**
 * Hook do pobierania pojedynczego wpisu
 */
export function useGuestbookEntry(id) {
  const loading = false;
  const error = null;
  const data = { guestbookEntry: null };

  return {
    entry: data?.guestbookEntry,
    loading,
    error
  };
}
