# mathpix-markdown

Component that can render Mathpix output.

## Install

**node.js**

```bash
npm install https://github.com/Mathpix/mathpix-markdown.git
```

## Usage examples

### Sample for React Component

```js
import {MathpixMarkdown, MathpixLoader} from 'mathpix-markdown';


class App extends Component {
  render() {
    return (
      <MathpixLoader>
          <MathpixMarkdown text="\\(ax^2 + bx + c = 0\\)"/>
       </MathpixLoader>
    );
  }
}
```

## props

| prop             | type&nbsp;*`default`*        |  description                                                                                                          |
|------------------|------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `text`           | sting                        | string that will be converted                                                                                         |
| `alignMathBlock` | string&nbsp;*`center`*       | should align `math-block`                                                                                             |
| `display`        | string&nbsp;*`block`*        | `block` - the whole space, `inline-block` - renders in its actual size                                                |
| `showTimeLog`    | boolean&nbsp;*`false`*       | should show execution time in console                                                                                 |
| `isDisableFancy` | boolean&nbsp;*`false`*       | `true` - disables processing of special characters (Example: `(c)`, `+`, `-` )                                        |
| `disableRules`   | array of strings&nbsp;*`[]`* | We can pass a list of rules for markdown rendering that should be disabled but only if `isDisableFancy` is not `true`.|
|                  |                              | Example:  `disableRules = ['replacements'] ` will disable fancy characters processing.                                |


### Sample for non-React UI code

```js
import {MathpixMarkdownModel as MM} from 'mathpix-markdown';

const html = MM.render('# markdown-it rulezz!', 'right');

```


```js
    MM.render ( text: string, options: optionsMathpixMarkdown );

````
## optionsMathpixMarkdown

|                  | type&nbsp;*`default`*        |  description                                                                                                          |
|------------------|------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `alignMathBlock` | string&nbsp;*`center`*       | should align `math-block`                                                                                             |
| `display`        | string&nbsp;*`block`*        | `block` - the whole space, `inline-block` - renders in its actual size                                                |
| `showTimeLog`    | boolean&nbsp;*`false`*       | should show execution time in console                                                                                 |
| `isDisableFancy` | boolean&nbsp;*`false`*       | `true` - disables processing of special characters (Example: `(c)`, `+`, `-` )                                        |
| `disableRules`   | array of strings&nbsp;*`[]`* | We can pass a list of rules for markdown rendering that should be disabled but only if `isDisableFancy` is not `true`.|
|                  |                              | Example:  `disableRules = ['replacements'] ` will disable fancy characters processing.                                |

## Development

### Get Started

#### - Install dependencies

```shell
$ npm install
```

#### - Build the component for production deployment

```shell
$ npm run build
```