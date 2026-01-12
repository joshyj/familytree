import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getFullName } from '../utils/helpers';
import styles from './Gallery.module.css';

interface PhotoWithPerson {
  photo: {
    id: string;
    url: string;
    caption?: string;
    takenAt?: string;
    uploadedAt: string;
  };
  person: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function Gallery() {
  const navigate = useNavigate();
  const personsRecord = useStore((state) => state.persons);
  const persons = Object.values(personsRecord);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithPerson | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allPhotos = useMemo((): PhotoWithPerson[] => {
    const photos: PhotoWithPerson[] = [];
    persons.forEach((person) => {
      person.photos.forEach((photo) => {
        photos.push({ photo, person });
      });
    });
    return photos.sort(
      (a, b) =>
        new Date(b.photo.uploadedAt).getTime() -
        new Date(a.photo.uploadedAt).getTime()
    );
  }, [persons]);

  const openPhoto = (photoWithPerson: PhotoWithPerson, index: number) => {
    setSelectedPhoto(photoWithPerson);
    setSelectedIndex(index);
  };

  const closePhoto = () => {
    setSelectedPhoto(null);
  };

  const goToPrevious = () => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);
      setSelectedPhoto(allPhotos[newIndex]);
    }
  };

  const goToNext = () => {
    if (selectedIndex < allPhotos.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);
      setSelectedPhoto(allPhotos[newIndex]);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Photo Gallery</h1>
        <span className={styles.count}>{allPhotos.length} photos</span>
      </header>

      {allPhotos.length === 0 ? (
        <div className={styles.emptyState}>
          <Image size={64} color="#D1D5DB" />
          <h3>No Photos Yet</h3>
          <p>Add photos to family members' profiles to see them here.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {allPhotos.map((item, index) => (
            <button
              key={`${item.person.id}-${item.photo.id}`}
              className={styles.photoCard}
              onClick={() => openPhoto(item, index)}
            >
              <img
                src={item.photo.url}
                alt={item.photo.caption || 'Family photo'}
                className={styles.photo}
              />
            </button>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <div className={styles.lightbox}>
          <div className={styles.lightboxBackdrop} onClick={closePhoto} />
          <div className={styles.lightboxContent}>
            <button className={styles.closeButton} onClick={closePhoto}>
              <X size={24} />
            </button>

            {selectedIndex > 0 && (
              <button className={styles.navButton} data-direction="prev" onClick={goToPrevious}>
                <ChevronLeft size={32} />
              </button>
            )}

            <img
              src={selectedPhoto.photo.url}
              alt={selectedPhoto.photo.caption || 'Family photo'}
              className={styles.lightboxImage}
            />

            {selectedIndex < allPhotos.length - 1 && (
              <button className={styles.navButton} data-direction="next" onClick={goToNext}>
                <ChevronRight size={32} />
              </button>
            )}

            <div className={styles.lightboxInfo}>
              <button
                className={styles.personLink}
                onClick={() => navigate(`/person/${selectedPhoto.person.id}`)}
              >
                {getFullName(selectedPhoto.person.firstName, selectedPhoto.person.lastName)}
              </button>
              {selectedPhoto.photo.caption && (
                <p className={styles.caption}>{selectedPhoto.photo.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
