// Komponent modal do dodawania stron webringu - podobny do systemu downloads
import { useState } from 'react';
import styles from './AddSiteModal.module.scss';

export default function AddSiteModal({ isOpen, onClose, onSiteAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category: 'retro',
    owner: '',
    tags: '',
    icon: '🌐'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dostępne kategorie
  const categories = [
    'retro',
    'gaming',
    'technology',
    'art',
    'music',
    'blog',
    'portfolio',
    'e-commerce',
    'community',
    'education',
    'entertainment',
    'news',
    'personal',
    'business',
    'other'
  ];

  // Dostępne ikony
  const icons = [
    '🌐', '💻', '🎮', '🎨', '🎵', '📱', '📚', '🛒', '👥', '🎭', '📰', '🏠', '💼', '🔧', '🌟'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Walidacja podstawowa
      if (!formData.name.trim() || !formData.url.trim() || !formData.description.trim()) {
        setError('Name, URL, and description are required');
        setLoading(false);
        return;
      }

      // Walidacja URL
      try {
        new URL(formData.url);
      } catch {
        setError('Please enter a valid URL (http:// or https://)');
        setLoading(false);
        return;
      }

      // Przygotuj dane do wysłania
      const siteData = {
        name: formData.name.trim(),
        url: formData.url.trim(),
        description: formData.description.trim(),
        category: formData.category,
        owner: formData.owner.trim() || 'Anonymous',
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        icon: formData.icon
      };

      // Wyślij do API
      const response = await fetch('/api/webring/add-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(siteData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Site added successfully! It will appear in the webring shortly.');
        setFormData({
          name: '',
          url: '',
          description: '',
          category: 'retro',
          owner: '',
          tags: '',
          icon: '🌐'
        });
        
        // Wywołaj callback jeśli strona została dodana
        if (onSiteAdded) {
          onSiteAdded(result.site);
        }
        
        // Automatyczne zamknięcie po 2 sekundach
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Failed to add site. Please try again.');
      }
    } catch (err) {
      console.error('Error adding site:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      category: 'retro',
      owner: '',
      tags: '',
      icon: '🌐'
    });
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Add Your Site to Webring</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ×
          </button>
        </div>

        <div className={styles.modalContent}>
          {error && (
            <div className={styles.errorMessage}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {success && (
            <div className={styles.successMessage}>
              <strong>Success!</strong> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Site Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your site name"
                required
                maxLength={100}
                disabled={loading}
              />
              <small>2-100 characters</small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="url">Site URL *</label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="https://example.com"
                required
                disabled={loading}
              />
              <small>Must start with http:// or https://</small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your site (what it's about, content, etc.)"
                required
                maxLength={500}
                rows={3}
                disabled={loading}
              />
              <small>10-500 characters</small>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="icon">Icon</label>
                <select
                  id="icon"
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  {icons.map(icon => (
                    <option key={icon} value={icon}>
                      {icon} {icon === '🌐' ? 'Default' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="owner">Your Name (Optional)</label>
              <input
                type="text"
                id="owner"
                name="owner"
                value={formData.owner}
                onChange={handleInputChange}
                placeholder="Your name or nickname"
                maxLength={100}
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="tags">Tags (Optional)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="gaming, retro, blog, etc."
                disabled={loading}
              />
              <small>Separate with commas (max 10 tags)</small>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={handleClose}
                className={styles.cancelButton}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add to Webring'}
              </button>
            </div>
          </form>

          <div className={styles.infoBox}>
            <h4>📋 Webring Guidelines</h4>
            <ul>
              <li>Your site should be active and accessible</li>
              <li>Content should be appropriate for all audiences</li>
              <li>No spam, malware, or illegal content</li>
              <li>Consider adding a webring badge to your site</li>
              <li>You can add up to 5 sites per hour</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
