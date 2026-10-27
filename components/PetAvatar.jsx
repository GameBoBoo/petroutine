const AVATARS = {
  cat: '/assets/brand/pet-avatar-cat.svg',
  dog: '/assets/brand/pet-avatar-dog.svg',
};

export default function PetAvatar({ pet, size = 'normal' }) {
  const species = pet?.species === 'cat' ? 'cat' : 'dog';
  return <span className={`pet-avatar ${species} ${size}`} aria-hidden="true">
    <img src={AVATARS[species]} alt="" width="160" height="160" loading="lazy" />
  </span>;
}
