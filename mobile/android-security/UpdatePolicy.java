package me.mohamedlaaribi.footy.production;

import java.net.URI;
import java.util.Arrays;

public final class UpdatePolicy {
    private UpdatePolicy() {}

    public static boolean trustedTransport(String value) {
        try {
            URI uri = new URI(value);
            String host = uri.getHost();
            return "https".equals(uri.getScheme()) && uri.getUserInfo() == null
                && (uri.getPort() == -1 || uri.getPort() == 443)
                && ("github.com".equals(host) || "release-assets.githubusercontent.com".equals(host)
                    || "objects.githubusercontent.com".equals(host));
        } catch (Exception error) { return false; }
    }

    public static boolean validAsset(String url) {
        return url != null && url.matches("https://github\\.com/MO7KUN/Footy/releases/download/[A-Za-z0-9._-]+/Footy\\.apk");
    }

    public static boolean matchesDigest(String expected, byte[] digest) {
        StringBuilder result = new StringBuilder();
        for (byte value : digest) {
            result.append(String.format("%02x", value & 0xff));
        }
        return result.toString().equals(expected);
    }

    public static boolean sameSigners(byte[][] installed, byte[][] candidate) {
        if (installed == null || candidate == null || installed.length == 0 || installed.length != candidate.length) return false;
        for (byte[] signer : installed) {
            boolean found = false;
            for (byte[] other : candidate) if (Arrays.equals(signer, other)) found = true;
            if (!found) return false;
        }
        return true;
    }
}
