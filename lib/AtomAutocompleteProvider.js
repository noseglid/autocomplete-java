'use babel';

import { _ } from 'lodash';
import atomJavaUtil from './atomJavaUtil';

export class AtomAutocompleteProvider {

  constructor(classLoader) {
    this.classLoader = classLoader;

    // settings for autocomplete-plus
    this.selector = '.source.java';
    this.disableForSelector = '.source.java .comment';
  }

  configure(config) {
    // settings for autocomplete-plus
    this.inclusionPriority = config.inclusionPriority;
    this.excludeLowerPriority = config.excludeLowerPriority;
  }

  // autocomplete-plus
  getSuggestions({editor, bufferPosition, scopeDescriptor,
      prefix: origPrefix, activatedManually}) {
    // text: 'package.Class.me', prefix: 'package.Class', suffix: 'me'
    // text: 'package.Cla', prefix: 'package', suffix: 'Cla'
    // text: 'Cla', prefix: '', suffix: 'Cla'
    let text = atomJavaUtil.getWord(editor, bufferPosition, true);
    let prefix = text.substring(0, text.lastIndexOf('.'));
    let suffix = origPrefix.replace('.', '');
    let couldBeClass = /^[A-Z]/.test(suffix) || prefix;
    let isInstance = false;

    let results = null;
    if (couldBeClass) {
      // Find class
      results = this.classLoader.findClass(text);
    }

    if ((!results || !results.length) && prefix) {
      // Find member of a class
      let stat = atomJavaUtil.determineClassName(editor, bufferPosition,
        text, prefix, suffix, this.prevReturnType, this.classLoader);
      if (stat.className) {
        results = this.classLoader.findClassMember(stat.className, suffix);
        isInstance = stat.isInstance;
      }
    }

    return _.map(results, (desc) => {
      return {
        snippet: this._createSnippet(desc, prefix, !isInstance),
        replacementPrefix: isInstance ? suffix : text,
        leftLabel: desc.member ? desc.member.returnType : desc.className,
        type: desc.type,
        desc: desc
      };
    });
  }

  _createSnippet(desc, prefix, addMemberClass) {
    let useFullClassName =
      (desc.type === 'class' ? prefix : prefix.indexOf('.') !== -1);
    let text = useFullClassName ? desc.className : desc.simpleName;
    if (desc.member) {
      text = (addMemberClass ? '${1:' + text + '}.' : '') +
        this._createMemberSnippet(desc.member);
    }
    return text;
  }

  _createMemberSnippet(member) {
    if (!member.params) {
      return member.name;
    } else {
      let params = _.map(member.params, (param, index) => {
        return '${' + (index+2) + ':' + param + '}';
      });
      return _.reduce(params, (result, param) => {
        return result + param + ', ';
      }, member.name + '(').replace(/, $/, ')');
    }
  }

  // autocomplete-plus
  onDidInsertSuggestion({editor, triggerPosition, suggestion}) {
    if (suggestion.type === 'class') {
      // Add import statement if simple class name was used as a completion text
      // and import does not already exist.
      // Do not import if class belongs in java.lang or current package.
      if (suggestion.snippet.indexOf('.') === -1 &&
          !atomJavaUtil.getImportClassName(editor, suggestion.desc.className) &&
          suggestion.desc.packageName !== 'java.lang' &&
          suggestion.desc.packageName !== atomJavaUtil.getCurrentPackageName(editor)) {
        this.organizeImports(editor, 'import ' + suggestion.desc.className+';');
      }
    } else if (suggestion.desc.member) {
      this.prevReturnType = suggestion.desc.member.returnType;
    }
    this.classLoader.touch(suggestion.desc);
  }

  organizeImports(editor, newImport) {
    let buffer = editor.getBuffer();
    buffer.transact(() => {
      // Get current imports
      let imports = buffer.getText().match(/import\s.*;/g) || [];
      if (newImport) {
        imports.push(newImport);
      }
      // Remove current imports
      buffer.replace(/import\s.*;[\r\n]+/g, '');
      // Add sorted imports
      buffer.insert([1,0], '\n');
      _.each(_.sortBy(imports), (value,index) => {
        buffer.insert([index+2,0], value + '\n');
      });
    });
  }

}