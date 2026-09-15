const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/Assets/AssetFormModal.tsx', 'utf8');

// 1. Add AuthContext
code = code.replace(
  "import { useToast } from '@/contexts/ToastContext';",
  "import { useToast } from '@/contexts/ToastContext';\nimport { useAuth } from '@/contexts/AuthContext';"
);

// 2. Add useAuth hook
code = code.replace(
  "const toast = useToast();",
  "const toast = useToast();\n  const { user } = useAuth();"
);

// 3. Update resetForm
code = code.replace(
  "const resetForm = () => {\n    setOperation('REPAIRING');",
  "const resetForm = () => {\n    let defaultOp = 'REPAIRING';\n    if (user?.role === 'MANUFACTURING_SUPERVISOR') defaultOp = 'MANUFACTURING';\n    \n    setOperation(defaultOp);"
);

// 4. Update Pipeline buttons
const oldPipeline = `{['REPAIRING', 'MANUFACTURING'].map(op => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => {
                          setOperation(op);
                          setLocL1('');
                          setLocL2('');
                          setLocL3('');
                        }}
                        className={\`px-5 py-2.5 rounded-md text-sm font-medium border-2 transition-colors \${
                          operation === op
                            ? 'border-gray-900 bg-gray-200 text-gray-900'
                            : 'border-gray-600 bg-white text-gray-700 hover:bg-gray-50'
                        }\`}
                      >
                        {op}
                      </button>
                    ))}`;

const newPipeline = `{['REPAIRING', 'MANUFACTURING'].map(op => {
                      if (user?.role === 'MANUFACTURING_SUPERVISOR' && op !== 'MANUFACTURING') return null;
                      if (user?.role === 'REPAIR_SUPERVISOR' && op !== 'REPAIRING') return null;
                      
                      return (
                        <button
                          key={op}
                          type="button"
                          onClick={() => {
                            setOperation(op);
                            setLocL1('');
                            setLocL2('');
                            setLocL3('');
                          }}
                          className={\`px-5 py-2.5 rounded-md text-sm font-medium border-2 transition-colors \${
                            operation === op
                              ? 'border-gray-900 bg-gray-200 text-gray-900'
                              : 'border-gray-600 bg-white text-gray-700 hover:bg-gray-50'
                          }\`}
                        >
                          {op}
                        </button>
                      );
                    })}`;

code = code.replace(oldPipeline, newPipeline);

fs.writeFileSync('frontend/src/components/Assets/AssetFormModal.tsx', code);
