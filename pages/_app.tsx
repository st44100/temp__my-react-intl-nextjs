import * as React from 'react';
import {IntlProvider} from 'react-intl';
import {polyfill} from '../polyfills';
import App from 'next/app';

function MyApp({Component, pageProps, locale, messages}) {
  return (
    <IntlProvider locale={locale} defaultLocale="en" messages={messages}>
      <Component {...pageProps} />
    </IntlProvider>
  );
}

/**
 * Get the messages and also do locale negotiation. A multi-lingual user
 * can specify locale prefs like ['ja', 'en-GB', 'en'] which is interpreted as
 * Japanese, then British English, then English
 * @param locales list of requested locales
 * @returns {[string, Promise]} A tuple containing the negotiated locale
 * and the promise of fetching the translated messages
 */
function getMessages(locales: string | string[] = ['en']) {
  if (!Array.isArray(locales)) {
    locales = [locales];
  }
  let langBundle;
  let locale;

  // サポートしているlocalに当たるまで走査
  // コンパイル済みじゃないとダメぽい。formatjsでコンパイルする。辞書自体はICUフォーマットをサポートしている
  // $ formatjs compile-folder --ast --format simple lang/ compiled-lang/
  //
  for (let i = 0; i < locales.length && !locale; i++) {
    locale = locales[i];
    switch (locale) {
      case 'fr':
        langBundle = import('../compiled-lang/fr.json');
        break;
      case 'en-GB':
        langBundle = import('../compiled-lang/en-GB.json');
        break;
      case 'zh-Hans-CN':
        langBundle = import('../compiled-lang/zh-Hans-CN.json');
        break;
      case 'zh-Hant-HK':
        langBundle = import('../compiled-lang/zh-Hant-HK.json');
        break;
      default:
        break;
      // Add more languages
    }
  }

  // サポートしているlocalが見当たらない場合
  if (!langBundle) {
    return ['en', import('../compiled-lang/en.json')];
  }
  return [locale, langBundle];
}

const getInitialProps: typeof App.getInitialProps = async appContext => {
  const {
    ctx: {req},
  } = appContext;

  // SSR and Client ロケール判定
  const requestedLocales: string | string[] =
    (req as any)?.locale ||
    (typeof navigator !== 'undefined' && navigator.languages) ||
    // IE11
    (typeof navigator !== 'undefined' && (navigator as any).userLanguage) ||
    (typeof window !== 'undefined' && (window as any).LOCALE) ||
    'en';

  // 要求ロケールは複数くる場合がある。その場合は文字列の配列

  // ロケール決定
  // ?: messagePromise
  const [supportedLocale, messagePromise] = getMessages(requestedLocales);

  const [, messages, appProps] = await Promise.all([
    polyfill(supportedLocale), // ?: polyfill(supportedLocale)
    messagePromise, // localeの辞書がロードされるのをまつ
    App.getInitialProps(appContext), // いつものハイドレーション
  ]);

  // appのpropsとして、決定したロケールと辞書(message)を渡す
  return {
    ...(appProps as any),
    locale: supportedLocale,
    messages: messages.default,
  };
};

MyApp.getInitialProps = getInitialProps;

export default MyApp;
