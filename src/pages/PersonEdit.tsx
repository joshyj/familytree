import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Camera, ImagePlus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getFullName } from '../utils/helpers';
import { Person } from '../types';
import styles from './PersonEdit.module.css';

// Get all descendants of a person (children, grandchildren, etc.) to prevent cycles
function getAllDescendants(
  personId: string,
  personsRecord: Record<string, Person>,
  visited = new Set<string>()
): Set<string> {
  if (visited.has(personId)) return visited;
  visited.add(personId);

  const person = personsRecord[personId];
  if (!person) return visited;

  const childIds = [...new Set([...person.children, ...person.childrenIds])];
  for (const childId of childIds) {
    getAllDescendants(childId, personsRecord, visited);
  }

  return visited;
}

export default function PersonEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const personsRecord = useStore((state) => state.persons);
  const persons = Object.values(personsRecord);
  const addPerson = useStore((state) => state.addPerson);
  const updatePerson = useStore((state) => state.updatePerson);
  const addPhoto = useStore((state) => state.addPhoto);

  const existingPerson = !isNew ? persons.find((p) => p.id === id) : null;

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    birthDate: '',
    deathDate: '',
    birthPlace: '',
    gender: '' as '' | 'male' | 'female' | 'other',
    bio: '',
    spouseId: '',
    parents: [] as string[],
  });

  useEffect(() => {
    if (existingPerson) {
      setFormData({
        firstName: existingPerson.firstName,
        lastName: existingPerson.lastName,
        nickname: existingPerson.nickname || '',
        birthDate: existingPerson.birthDate || '',
        deathDate: existingPerson.deathDate || '',
        birthPlace: existingPerson.birthPlace || '',
        gender: existingPerson.gender || '',
        bio: existingPerson.bio || '',
        spouseId: existingPerson.spouseId || '',
        parents: existingPerson.parents,
      });
    }
  }, [existingPerson]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      // If spouse is changed, remove them from parents if they were selected
      if (name === 'spouseId' && value && prev.parents.includes(value)) {
        return { ...prev, [name]: value, parents: prev.parents.filter((id) => id !== value) };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleParentToggle = (personId: string) => {
    setFormData((prev) => ({
      ...prev,
      parents: prev.parents.includes(personId)
        ? prev.parents.filter((id) => id !== personId)
        : prev.parents.length < 2
        ? [...prev.parents, personId]
        : prev.parents,
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !existingPerson) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      addPhoto(existingPerson.id, url);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim()) {
      alert('First name is required');
      return;
    }

    if (isNew) {
      const newPerson = addPerson({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        nickname: formData.nickname.trim() || undefined,
        birthDate: formData.birthDate || undefined,
        deathDate: formData.deathDate || undefined,
        birthPlace: formData.birthPlace.trim() || undefined,
        gender: formData.gender || undefined,
        bio: formData.bio.trim() || undefined,
        spouseId: formData.spouseId || undefined,
        parents: formData.parents,
      });
      navigate(`/person/${newPerson.id}`);
    } else if (existingPerson) {
      updatePerson(existingPerson.id, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        nickname: formData.nickname.trim() || undefined,
        birthDate: formData.birthDate || undefined,
        deathDate: formData.deathDate || undefined,
        birthPlace: formData.birthPlace.trim() || undefined,
        gender: formData.gender || undefined,
        bio: formData.bio.trim() || undefined,
        spouseId: formData.spouseId || undefined,
        parents: formData.parents,
      });
      navigate(`/person/${existingPerson.id}`);
    }
  };

  const availableSpouses = persons.filter(
    (p) => p.id !== id && (!p.spouseId || p.spouseId === id)
  );

  // Get all descendants to prevent cycle in parent-child hierarchy
  const descendantIds = useMemo(() => {
    if (!id || isNew) return new Set<string>();
    return getAllDescendants(id, personsRecord);
  }, [id, isNew, personsRecord]);

  // Exclude self, all descendants, and selected spouse from available parents
  const availableParents = persons.filter(
    (p) => p.id !== id && !descendantIds.has(p.id) && p.id !== formData.spouseId
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className={styles.title}>
          {isNew ? 'Add Person' : 'Edit Person'}
        </h1>
        <button className={styles.saveBtn} onClick={handleSubmit}>
          <Save size={20} />
        </button>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        {!isNew && existingPerson && (
          <div className={styles.photoSection}>
            <div className={styles.photoButtons}>
              <button
                type="button"
                className={styles.photoUpload}
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera size={24} />
                <span>Take Photo</span>
              </button>
              <button
                type="button"
                className={styles.photoUpload}
                onClick={() => galleryInputRef.current?.click()}
              >
                <ImagePlus size={24} />
                <span>Gallery</span>
              </button>
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              hidden
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              hidden
            />
            {existingPerson.photos.length > 0 && (
              <div className={styles.photoPreview}>
                {existingPerson.photos.slice(0, 4).map((photo) => (
                  <img key={photo.id} src={photo.url} alt="" />
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Information</h2>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
                required
              />
            </div>
            <div className={styles.field}>
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Nickname</label>
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="Nickname or pet name"
            />
          </div>

          <div className={styles.field}>
            <label>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Dates & Places</h2>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Birth Date</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
              />
            </div>
            <div className={styles.field}>
              <label>Death Date</label>
              <input
                type="date"
                name="deathDate"
                value={formData.deathDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Birthplace</label>
            <input
              type="text"
              name="birthPlace"
              value={formData.birthPlace}
              onChange={handleChange}
              placeholder="City, Country"
            />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Biography</h2>
          <div className={styles.field}>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Write a short biography..."
              rows={4}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Relationships</h2>

          <div className={styles.field}>
            <label>Spouse</label>
            <select name="spouseId" value={formData.spouseId} onChange={handleChange}>
              <option value="">No spouse selected</option>
              {availableSpouses.map((p) => (
                <option key={p.id} value={p.id}>
                  {getFullName(p.firstName, p.lastName)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Parents (select up to 2)</label>
            <div className={styles.checkboxList}>
              {availableParents.map((p) => (
                <label key={p.id} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={formData.parents.includes(p.id)}
                    onChange={() => handleParentToggle(p.id)}
                    disabled={
                      !formData.parents.includes(p.id) &&
                      formData.parents.length >= 2
                    }
                  />
                  <span>{getFullName(p.firstName, p.lastName)}</span>
                </label>
              ))}
              {availableParents.length === 0 && (
                <p className={styles.noOptions}>
                  Add more people to set relationships
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button type="submit" className={styles.submitButton}>
            {isNew ? 'Add Person' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
