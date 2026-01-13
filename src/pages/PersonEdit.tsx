import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Camera, ImagePlus, Plus, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getFullName } from '../utils/helpers';
import { Person, SpouseRelationship, ParentRelationship, SpouseStatus, ParentType } from '../types';
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
    spouseRelationships: [] as SpouseRelationship[],
    parentRelationships: [] as ParentRelationship[],
    parents: [] as string[],
  });

  useEffect(() => {
    if (existingPerson) {
      // Build parent relationships from existing parents
      const parentRels: ParentRelationship[] = existingPerson.parentRelationships ||
        existingPerson.parents.map(parentId => ({ personId: parentId, type: 'biological' as ParentType }));

      // Build spouse relationships
      const spouseRels: SpouseRelationship[] = existingPerson.spouseRelationships ||
        (existingPerson.spouseId ? [{ personId: existingPerson.spouseId, status: 'current' as SpouseStatus }] : []);

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
        spouseRelationships: spouseRels,
        parentRelationships: parentRels,
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
    setFormData((prev) => {
      const isSelected = prev.parentRelationships.some(r => r.personId === personId);
      if (isSelected) {
        return {
          ...prev,
          parents: prev.parents.filter((id) => id !== personId),
          parentRelationships: prev.parentRelationships.filter(r => r.personId !== personId),
        };
      } else if (prev.parentRelationships.length < 4) {
        // Allow up to 4 parents (2 biological + 2 step)
        return {
          ...prev,
          parents: [...prev.parents, personId],
          parentRelationships: [...prev.parentRelationships, { personId, type: 'biological' as ParentType }],
        };
      }
      return prev;
    });
  };

  const handleParentTypeChange = (personId: string, type: ParentType) => {
    setFormData((prev) => ({
      ...prev,
      parentRelationships: prev.parentRelationships.map(r =>
        r.personId === personId ? { ...r, type } : r
      ),
    }));
  };

  const handleAddSpouse = (personId: string) => {
    if (!personId || formData.spouseRelationships.some(r => r.personId === personId)) return;
    setFormData((prev) => ({
      ...prev,
      spouseRelationships: [...prev.spouseRelationships, { personId, status: 'current' as SpouseStatus }],
      // Set as current spouse if it's the first or marked as current
      spouseId: prev.spouseRelationships.length === 0 ? personId : prev.spouseId,
    }));
  };

  const handleRemoveSpouse = (personId: string) => {
    setFormData((prev) => {
      const newRels = prev.spouseRelationships.filter(r => r.personId !== personId);
      const currentSpouse = newRels.find(r => r.status === 'current');
      return {
        ...prev,
        spouseRelationships: newRels,
        spouseId: currentSpouse?.personId || '',
      };
    });
  };

  const handleSpouseStatusChange = (personId: string, status: SpouseStatus) => {
    setFormData((prev) => {
      const newRels = prev.spouseRelationships.map(r => {
        if (r.personId === personId) {
          return { ...r, status };
        }
        // If setting someone as current, set others to divorced
        if (status === 'current' && r.status === 'current') {
          return { ...r, status: 'divorced' as SpouseStatus };
        }
        return r;
      });
      return {
        ...prev,
        spouseRelationships: newRels,
        spouseId: status === 'current' ? personId : (newRels.find(r => r.status === 'current')?.personId || ''),
      };
    });
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
        spouseRelationships: formData.spouseRelationships,
        parentRelationships: formData.parentRelationships,
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
        spouseRelationships: formData.spouseRelationships,
        parentRelationships: formData.parentRelationships,
        parents: formData.parents,
      });
      navigate(`/person/${existingPerson.id}`);
    }
  };

  // For spouse selection, allow any person except self and those already in relationships
  const selectedSpouseIds = formData.spouseRelationships.map(r => r.personId);
  const availableSpouses = persons.filter(
    (p) => p.id !== id && !selectedSpouseIds.includes(p.id)
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

          {/* Spouse Relationships */}
          <div className={styles.field}>
            <label>Spouses / Partners</label>
            {formData.spouseRelationships.length > 0 && (
              <div className={styles.relationshipList}>
                {formData.spouseRelationships.map((rel) => {
                  const spouse = persons.find(p => p.id === rel.personId);
                  if (!spouse) return null;
                  return (
                    <div key={rel.personId} className={styles.relationshipRow}>
                      <span className={styles.relationshipName}>
                        {getFullName(spouse.firstName, spouse.lastName)}
                      </span>
                      <select
                        value={rel.status}
                        onChange={(e) => handleSpouseStatusChange(rel.personId, e.target.value as SpouseStatus)}
                        className={styles.relationshipSelect}
                      >
                        <option value="current">Current</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                        <option value="separated">Separated</option>
                      </select>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => handleRemoveSpouse(rel.personId)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {availableSpouses.length > 0 && (
              <div className={styles.addRelationship}>
                <select
                  id="addSpouse"
                  defaultValue=""
                  onChange={(e) => {
                    handleAddSpouse(e.target.value);
                    e.target.value = '';
                  }}
                >
                  <option value="" disabled>Add spouse/partner...</option>
                  {availableSpouses.map((p) => (
                    <option key={p.id} value={p.id}>
                      {getFullName(p.firstName, p.lastName)}
                    </option>
                  ))}
                </select>
                <Plus size={18} className={styles.addIcon} />
              </div>
            )}
          </div>

          {/* Parent Relationships */}
          <div className={styles.field}>
            <label>Parents (up to 4 including step-parents)</label>
            {formData.parentRelationships.length > 0 && (
              <div className={styles.relationshipList}>
                {formData.parentRelationships.map((rel) => {
                  const parent = persons.find(p => p.id === rel.personId);
                  if (!parent) return null;
                  return (
                    <div key={rel.personId} className={styles.relationshipRow}>
                      <span className={styles.relationshipName}>
                        {getFullName(parent.firstName, parent.lastName)}
                      </span>
                      <select
                        value={rel.type}
                        onChange={(e) => handleParentTypeChange(rel.personId, e.target.value as ParentType)}
                        className={styles.relationshipSelect}
                      >
                        <option value="biological">Biological</option>
                        <option value="step">Step-parent</option>
                        <option value="adoptive">Adoptive</option>
                      </select>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => handleParentToggle(rel.personId)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {availableParents.length > 0 && formData.parentRelationships.length < 4 && (
              <div className={styles.addRelationship}>
                <select
                  id="addParent"
                  defaultValue=""
                  onChange={(e) => {
                    handleParentToggle(e.target.value);
                    e.target.value = '';
                  }}
                >
                  <option value="" disabled>Add parent...</option>
                  {availableParents.filter(p => !formData.parentRelationships.some(r => r.personId === p.id)).map((p) => (
                    <option key={p.id} value={p.id}>
                      {getFullName(p.firstName, p.lastName)}
                    </option>
                  ))}
                </select>
                <Plus size={18} className={styles.addIcon} />
              </div>
            )}
            {availableParents.length === 0 && formData.parentRelationships.length === 0 && (
              <p className={styles.noOptions}>
                Add more people to set relationships
              </p>
            )}
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
