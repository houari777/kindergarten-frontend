// This plugin fixes the 'use' import issue from 'react'
module.exports = function (babel) {
  const { types: t } = babel;

  return {
    name: 'fix-react-use-import',
    visitor: {
      ImportDeclaration(path) {
        // Skip if not importing from 'react'
        if (path.node.source.value !== 'react') return;

        // Find if there's a 'use' import specifier
        const hasUseSpecifier = path.node.specifiers.some(
          specifier => 
            t.isImportSpecifier(specifier) && 
            t.isIdentifier(specifier.imported, { name: 'use' })
        );

        if (hasUseSpecifier) {
          // Remove the 'use' import specifier
          path.node.specifiers = path.node.specifiers.filter(
            specifier => 
              !(t.isImportSpecifier(specifier) && 
                t.isIdentifier(specifier.imported, { name: 'use' }))
          );

          // If no more specifiers, remove the entire import
          if (path.node.specifiers.length === 0) {
            path.remove();
          }
        }
      },
    },
  };
};
