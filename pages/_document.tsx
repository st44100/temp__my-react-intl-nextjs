import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext,
} from 'next/document';

interface Props {
  locale: string;
  lang: string;
  nonce: string;
}

class MyDocument extends Document<Props> {
  static async getInitialProps(ctx: DocumentContext) {
    const {req} = ctx;
    const initialProps = await Document.getInitialProps(ctx);
    const locale = (req as any).locale;

    // localeとnonceは _server.tsで設置されている
    return {
      ...initialProps,
      locale,
      lang: locale ? locale.split('-')[0] : undefined,
      nonce: (req as any).nonce,
    };
  }

  render() {
    // localeが設定されていたら、`window.LOCALE`へ値を設置する
    let scriptEl;
    if (this.props.locale) {
      scriptEl = (
        <script
          nonce={this.props.nonce}
          dangerouslySetInnerHTML={{
            __html: `window.LOCALE="${this.props.locale}"`,
          }}
        ></script>
      );
    }

    return (
      <Html lang={this.props.lang}>
        <Head />
        <body>
          {scriptEl}
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
