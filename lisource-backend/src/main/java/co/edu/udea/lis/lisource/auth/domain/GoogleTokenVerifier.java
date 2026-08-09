package co.edu.udea.lis.lisource.auth.domain;

public interface GoogleTokenVerifier {
    GoogleIdentity verify(String credential);
}

