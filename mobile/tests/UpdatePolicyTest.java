package me.mohamedlaaribi.footy.production;

import java.security.MessageDigest;

public class UpdatePolicyTest {
    private static void check(boolean value) { if (!value) throw new AssertionError(); }
    public static void main(String[] args) throws Exception {
        check(UpdatePolicy.validAsset("https://github.com/MO7KUN/Footy/releases/download/android-v1.0.1-3/Footy.apk"));
        check(!UpdatePolicy.validAsset("https://github.com/other/Footy/releases/download/v1/Footy.apk"));
        check(!UpdatePolicy.validAsset("https://github.com/MO7KUN/Footy/releases/download/v1/Footy.apk?redirect=evil"));
        check(UpdatePolicy.trustedTransport("https://release-assets.githubusercontent.com/github-production-release-asset/test?sig=123"));
        for (String url : new String[]{"http://github.com/file", "https://github.com.evil.test/file", "https://github.com@evil.test/file", "file:///tmp/update.apk", "https://github.com:8080/file"}) {
            check(!UpdatePolicy.trustedTransport(url));
        }
        byte[] digest = MessageDigest.getInstance("SHA-256").digest("abc".getBytes("UTF-8"));
        check(UpdatePolicy.matchesDigest("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", digest));
        check(!UpdatePolicy.matchesDigest("0000000000000000000000000000000000000000000000000000000000000000", digest));
        check(UpdatePolicy.sameSigners(new byte[][]{{1,2}}, new byte[][]{{1,2}}));
        check(!UpdatePolicy.sameSigners(new byte[][]{{1,2}}, new byte[][]{{3,4}}));
        check(!UpdatePolicy.sameSigners(new byte[][]{{1,2}}, new byte[][]{{1,2},{3,4}}));
        check(!UpdatePolicy.sameSigners(new byte[][]{}, new byte[][]{}));
        check(!UpdatePolicy.sameSigners(null, new byte[][]{{1,2}}));
        System.out.println("Update URL, checksum and signer policies passed");
    }
}
