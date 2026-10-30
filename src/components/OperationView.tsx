/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShipMainframeCockpit } from './ShipMainframeCockpit';

export const OperationView: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col bg-[#01040d] p-0 m-0 overflow-hidden select-none">
      <ShipMainframeCockpit />
    </div>
  );
};
