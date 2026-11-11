package me.mohamedlaaribi.footy.production;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

public final class UpdateDownload {
    private UpdateDownload() {}

    public static void copy(String address, OutputStream output, long limit) throws Exception {
        URL url = new URL(address);
        long deadline = System.currentTimeMillis() + 180000;
        for (int redirects = 0; redirects <= 5; redirects++) {
            if (!UpdatePolicy.trustedTransport(url.toString())) throw new IOException("Untrusted update download address");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(15000);
            try {
                int status = connection.getResponseCode();
                if (status >= 300 && status <= 399) {
                    String location = connection.getHeaderField("Location");
                    if (location == null) throw new IOException("Invalid update redirect");
                    url = new URL(url, location);
                    continue;
                }
                if (status != 200) throw new IOException("Update server returned " + status);
                if (connection.getContentLengthLong() > limit) throw new IOException("Update download is too large");
                try (InputStream input = connection.getInputStream()) {
                    byte[] buffer = new byte[16384];
                    long total = 0;
                    int count;
                    while ((count = input.read(buffer)) != -1) {
                        total += count;
                        if (total > limit || System.currentTimeMillis() > deadline) throw new IOException("Update download exceeded its limit");
                        output.write(buffer, 0, count);
                    }
                }
                return;
            } finally { connection.disconnect(); }
        }
        throw new IOException("Too many update redirects");
    }
}
