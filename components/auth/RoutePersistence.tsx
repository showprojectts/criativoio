
import React from 'react';

interface RoutePersistenceProps {
  children: React.ReactNode;
}

const RoutePersistence: React.FC<RoutePersistenceProps> = ({ children }) => {
  // Logic removed to ensure application stability and prevent navigation loops.
  // This component now acts as a simple pass-through wrapper.
  return <>{children}</>;
};

export default RoutePersistence;
