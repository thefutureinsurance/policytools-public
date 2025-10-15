import React, { useState } from 'react';
import { FormField } from './FormField';

export const UserForm: React.FC = () => {
  const [householdIncome, setHouseholdIncome] = useState('');
  const [age, setAge] = useState('');
  const [dob, setDob] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      householdIncome,
      age,
      dateOfBirth: dob,
    };

    console.log('Form data:', data);
    alert(`Form submitted:\n${JSON.stringify(data, null, 2)}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: 400,
        margin: '30px auto',
        padding: 20,
        border: '1px solid #eee',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>User Information</h2>

      <FormField
        label="Household Income"
        type="number"
        value={householdIncome}
        onChange={setHouseholdIncome}
        placeholder="Enter total income"
      />

      <FormField
        label="Age"
        type="number"
        value={age}
        onChange={setAge}
        placeholder="Enter your age"
      />

      <FormField
        label="Date of Birth"
        type="date"
        value={dob}
        onChange={setDob}
      />

      <button
        type="submit"
        style={{
          width: '100%',
          marginTop: 10,
          padding: 10,
          backgroundColor: '#007bff',
          color: '#fff',
          fontSize: 16,
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        Submit
      </button>
    </form>
  );
};