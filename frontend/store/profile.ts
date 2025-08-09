import { create } from 'zustand';

interface ProfileStore {
  profile: any;
  setProfile: (profile: any) => void;
}

const profileStore = create<ProfileStore>((set) => ({
  profile: null,
  setProfile: (profile) => set(() => ({ profile })),
}));

export default profileStore;