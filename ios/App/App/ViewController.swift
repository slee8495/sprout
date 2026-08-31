import Capacitor
import UIKit
import WebKit

/// The app doesn't bundle its web build — it loads the live site (see capacitor.config.ts). That
/// makes the page a remote origin as far as WKWebView is concerned, so the first time the journal
/// asks for the microphone, WKWebView puts up its own "…would like to access the microphone" alert
/// before iOS shows the real permission prompt.
///
/// App Review saw those two in a row on 1.0 (4) and read the first as a pre-prompt of ours: a custom
/// message with an Allow button that could be dismissed instead of continuing to the request
/// (guideline 5.1.1(iv)). The app has no such screen — the recorder calls getUserMedia directly —
/// so the fix is to stop the web layer from asking a question the system is about to ask properly.
///
/// Answering here removes that first alert. iOS still asks for the microphone itself, using the
/// usage string in Info.plist, which is the prompt the guideline is written about.
final class MediaCaptureUIDelegate: NSObject, WKUIDelegate {
    /// Capacitor's own delegate, which handles JS dialogs, file inputs and new windows. Everything
    /// this class doesn't implement is forwarded to it untouched.
    private let capacitorDelegate: WKUIDelegate

    init(forwardingTo capacitorDelegate: WKUIDelegate) {
        self.capacitorDelegate = capacitorDelegate
    }

    override func responds(to selector: Selector!) -> Bool {
        super.responds(to: selector) || capacitorDelegate.responds(to: selector)
    }

    override func forwardingTarget(for selector: Selector!) -> Any? {
        capacitorDelegate.responds(to: selector) ? capacitorDelegate : nil
    }

    func webView(
        _ webView: WKWebView,
        requestMediaCapturePermissionFor origin: WKSecurityOrigin,
        initiatedByFrame frame: WKFrameInfo,
        type: WKMediaCaptureType,
        decisionHandler: @escaping (WKPermissionDecision) -> Void
    ) {
        // Only our own site is spared the question. Anything else the web view somehow ends up
        // showing still gets WKWebView's alert, which is the safe answer for an origin we don't own.
        decisionHandler(origin.host == Self.appHost ? .grant : .prompt)
    }

    private static let appHost = "roun.sl-studio.dev"
}

class ViewController: CAPBridgeViewController {
    /// WKWebView holds `uiDelegate` weakly, so the proxy has to live as long as this controller.
    private var mediaCaptureDelegate: MediaCaptureUIDelegate?

    override func capacitorDidLoad() {
        super.capacitorDidLoad()

        guard let webView, let capacitorDelegate = webView.uiDelegate else { return }
        let delegate = MediaCaptureUIDelegate(forwardingTo: capacitorDelegate)
        mediaCaptureDelegate = delegate
        webView.uiDelegate = delegate
    }
}
