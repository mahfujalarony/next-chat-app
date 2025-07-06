import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RegisterState {
  firstName: string;
  lastName: string;
  step: number;
}

const initialState: RegisterState = {
  firstName: '',
  lastName: '',
  step: 1,
};


const registerSlice = createSlice({
  name: 'register',
  initialState,
  reducers: {
    setStep1: (state, action: PayloadAction<{firstName: string, lastName: string}>) => {
      state.firstName = action.payload.firstName;
      state.lastName = action.payload.lastName;
      state.step = 2;
    },
    setStep2: (state, action: PayloadAction<{email: string}>) => {
      state.step = 3; // verification page এ পাঠানোর জন্য
    },
    // setProfileImage: (state, action: PayloadAction<string>) => {
    //   state.profileImage = action.payload;
    //   state.step = 4; // profile image এর পরে verification
    // },
    // setEmailVerified: (state) => {
    //   state.isEmailVerified = true;
    //   state.step = 5; // final step
    // },
    resetRegister: () => initialState
  }
});

export const { setStep1, setStep2,  resetRegister } = registerSlice.actions;
export default registerSlice.reducer;