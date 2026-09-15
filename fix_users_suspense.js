const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/dashboard/users/page.tsx', 'utf8');

// Replace default export of UsersPage
code = code.replace(
  'export default function UsersPage() {',
  'import { Suspense } from "react";\n\nfunction UsersPageContent() {'
);

// Append the new export default at the bottom of the file
code += `

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading users...</div>}>
      <UsersPageContent />
    </Suspense>
  );
}
`;

fs.writeFileSync('frontend/src/app/dashboard/users/page.tsx', code);
