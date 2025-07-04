import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RegisterState {
  firstName: string;
  lastName: string;
  email: string;
  uid: string;
  profileImage: string;
  step: number;
  isEmailVerified: boolean; // নতুন field
}

const initialState: RegisterState = {
  firstName: '',
  lastName: '',
  email: '',
  uid: '',
  profileImage: '',
  step: 1,
  isEmailVerified: false, // default false
};

localStorage.getItem('firstName') && (initialState.firstName = localStorage.getItem('firstName') || '');
localStorage.getItem('lastName') && (initialState.lastName = localStorage.getItem('lastName') || '');
localStorage.getItem('email') && (initialState.email = localStorage.getItem('email') || '');
localStorage.getItem('uid') && (initialState.uid = localStorage.getItem('uid') || '');
localStorage.getItem('isEmailVerified') && (initialState.isEmailVerified = localStorage.getItem('isEmailVerified') === 'true');

const registerSlice = createSlice({
  name: 'register',
  initialState,
  reducers: {
    setStep1: (state, action: PayloadAction<{firstName: string, lastName: string}>) => {
      state.firstName = action.payload.firstName;
      state.lastName = action.payload.lastName;
      state.step = 2;
    },
    setStep2: (state, action: PayloadAction<{email: string, uid: string}>) => {
      state.email = action.payload.email;
      state.uid = action.payload.uid; 
      state.step = 3; // verification page এ পাঠানোর জন্য
    },
    setProfileImage: (state, action: PayloadAction<string>) => {
      state.profileImage = action.payload;
      state.step = 4; // profile image এর পরে verification
    },
    setEmailVerified: (state) => {
      state.isEmailVerified = true;
      state.step = 5; // final step
    },
    resetRegister: () => initialState
  }
});

export const { setStep1, setStep2, setProfileImage, setEmailVerified, resetRegister } = registerSlice.actions;
export default registerSlice.reducer;