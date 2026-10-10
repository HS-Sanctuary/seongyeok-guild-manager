using System;
using System.IO;

namespace IrisDesktop {
    // Policy only: no browser instance or access to existing browser profiles.
    public static class DesktopHostPolicy {
        public static bool ValidateNavigation(Uri target, bool development) {
            if (target == null || !target.IsAbsoluteUri || target.UserInfo.Length != 0) return false;
            if (development) return target.Scheme == "http" &&
                target.Host == "localhost" && target.Port == 3000;
            return target.Scheme == "https" && target.Port == 443 &&
                target.Host == "sanctum-tawny-three.vercel.app";
        }

        public static bool ValidatePartyExternal(Uri source, Uri target, bool development) {
            return ValidateNavigation(source, development) && source.AbsolutePath == "/iris/desktop" &&
                ValidateNavigation(target, development) && target.AbsolutePath == "/party" &&
                target.Query.Length == 0 && target.Fragment.Length == 0;
        }

        public static bool ValidateHomeExternal(Uri source, Uri target, bool development) {
            return ValidateNavigation(source, development) && source.AbsolutePath == "/iris/desktop" &&
                ValidateNavigation(target, false) && target.AbsolutePath == "/" &&
                target.Query.Length == 0 && target.Fragment.Length == 0;
        }

        public static string ProfilePath(string environment) {
            if (environment != "production" && environment != "development")
                throw new ArgumentException("Unknown desktop environment", "environment");
            return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Sanctum", "IRIS", "Desktop", environment, "WebViewProfile");
        }
    }
}
