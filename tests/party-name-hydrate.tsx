// Hydrate only the production name widget. All party actions stay inert;
// this test utility has no database, session or credentials.
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import ResponsiveMemberName from '../components/party/ResponsiveMemberName';

for (const node of document.querySelectorAll('.responsiveName')) {
  hydrateRoot(node.parentElement!, <ResponsiveMemberName
    fullName={document.body.dataset.fixtureName!}
    currentAlias={document.body.dataset.fixtureAlias}
  />);
}
