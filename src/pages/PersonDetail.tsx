import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Calendar,
  MapPin,
  Heart,
  Users,
  Image,
  MessageSquare,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { getInitials, stringToColor, getFullName, formatDate } from '../utils/helpers';
import styles from './PersonDetail.module.css';

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const personsRecord = useStore((state) => state.persons);
  const persons = Object.values(personsRecord);
  const stories = useStore((state) => state.stories);
  const currentUser = useStore((state) => state.currentUser);
  const addStory = useStore((state) => state.addStory);
  const deletePerson = useStore((state) => state.deletePerson);

  const [activeTab, setActiveTab] = useState<'info' | 'photos' | 'stories'>('info');
  const [newStory, setNewStory] = useState('');

  const person = persons.find((p) => p.id === id);

  if (!person) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Person Not Found</h2>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const personStories = stories[person.id] || [];
  const spouse = person.spouseId ? persons.find((p) => p.id === person.spouseId) : null;
  const parents = person.parents
    .map((parentId) => persons.find((p) => p.id === parentId))
    .filter(Boolean);
  const children = person.children
    .map((childId) => persons.find((p) => p.id === childId))
    .filter(Boolean);

  const handleAddStory = () => {
    if (!newStory.trim() || !currentUser) return;
    addStory(person.id, newStory.trim(), currentUser.id);
    setNewStory('');
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${getFullName(person.firstName, person.lastName)}?`)) {
      deletePerson(person.id);
      navigate('/tree');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className={styles.headerActions}>
          <button
            className={styles.editBtn}
            onClick={() => navigate(`/person/${id}/edit`)}
          >
            <Edit2 size={20} />
          </button>
          <button className={styles.deleteBtn} onClick={handleDelete}>
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <div className={styles.profile}>
        {person.profilePhoto ? (
          <img src={person.profilePhoto} alt="" className={styles.avatar} />
        ) : (
          <div
            className={styles.avatarPlaceholder}
            style={{ background: stringToColor(person.id) }}
          >
            {getInitials(person.firstName, person.lastName)}
          </div>
        )}
        <h1 className={styles.name}>
          {getFullName(person.firstName, person.lastName)}
        </h1>
        {person.nickname && (
          <p className={styles.nickname}>"{person.nickname}"</p>
        )}
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'info' ? styles.active : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <Users size={18} />
          Info
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'photos' ? styles.active : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          <Image size={18} />
          Photos ({person.photos.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'stories' ? styles.active : ''}`}
          onClick={() => setActiveTab('stories')}
        >
          <MessageSquare size={18} />
          Stories ({personStories.length})
        </button>
      </div>

      {activeTab === 'info' && (
        <div className={styles.infoContent}>
          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>Details</h3>
            <div className={styles.infoList}>
              {person.birthDate && (
                <div className={styles.infoItem}>
                  <Calendar size={18} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Born</span>
                    <span className={styles.infoValue}>
                      {formatDate(person.birthDate)}
                    </span>
                  </div>
                </div>
              )}
              {person.deathDate && (
                <div className={styles.infoItem}>
                  <Calendar size={18} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Died</span>
                    <span className={styles.infoValue}>
                      {formatDate(person.deathDate)}
                    </span>
                  </div>
                </div>
              )}
              {person.birthPlace && (
                <div className={styles.infoItem}>
                  <MapPin size={18} className={styles.infoIcon} />
                  <div>
                    <span className={styles.infoLabel}>Birthplace</span>
                    <span className={styles.infoValue}>{person.birthPlace}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {person.bio && (
            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>Biography</h3>
              <p className={styles.bio}>{person.bio}</p>
            </div>
          )}

          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>Relationships</h3>
            <div className={styles.relationshipList}>
              {spouse && (
                <button
                  className={styles.relationshipItem}
                  onClick={() => navigate(`/person/${spouse.id}`)}
                >
                  <Heart size={18} className={styles.relationIcon} />
                  <span className={styles.relationLabel}>Spouse</span>
                  <span className={styles.relationName}>
                    {getFullName(spouse.firstName, spouse.lastName)}
                  </span>
                </button>
              )}
              {parents.map((parent) => (
                <button
                  key={parent!.id}
                  className={styles.relationshipItem}
                  onClick={() => navigate(`/person/${parent!.id}`)}
                >
                  <Users size={18} className={styles.relationIcon} />
                  <span className={styles.relationLabel}>Parent</span>
                  <span className={styles.relationName}>
                    {getFullName(parent!.firstName, parent!.lastName)}
                  </span>
                </button>
              ))}
              {children.map((child) => (
                <button
                  key={child!.id}
                  className={styles.relationshipItem}
                  onClick={() => navigate(`/person/${child!.id}`)}
                >
                  <Users size={18} className={styles.relationIcon} />
                  <span className={styles.relationLabel}>Child</span>
                  <span className={styles.relationName}>
                    {getFullName(child!.firstName, child!.lastName)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'photos' && (
        <div className={styles.photosContent}>
          {person.photos.length === 0 ? (
            <div className={styles.emptyState}>
              <Image size={48} color="#D1D5DB" />
              <p>No photos yet</p>
              <button
                className={styles.addButton}
                onClick={() => navigate(`/person/${id}/edit`)}
              >
                <Plus size={18} />
                Add Photos
              </button>
            </div>
          ) : (
            <div className={styles.photoGrid}>
              {person.photos.map((photo) => (
                <div key={photo.id} className={styles.photoItem}>
                  <img src={photo.url} alt={photo.caption || ''} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stories' && (
        <div className={styles.storiesContent}>
          <div className={styles.storyInput}>
            <textarea
              placeholder="Share a memory or story..."
              value={newStory}
              onChange={(e) => setNewStory(e.target.value)}
              className={styles.storyTextarea}
            />
            <button
              className={styles.sendButton}
              onClick={handleAddStory}
              disabled={!newStory.trim()}
            >
              <Send size={20} />
            </button>
          </div>
          {personStories.length === 0 ? (
            <div className={styles.emptyState}>
              <MessageSquare size={48} color="#D1D5DB" />
              <p>No stories yet. Be the first to share!</p>
            </div>
          ) : (
            <div className={styles.storyList}>
              {personStories.map((story) => (
                <div key={story.id} className={styles.storyCard}>
                  <p className={styles.storyContent}>{story.content}</p>
                  <span className={styles.storyDate}>
                    {formatDate(story.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
