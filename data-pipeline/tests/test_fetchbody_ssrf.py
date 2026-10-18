from pipeline_news.stage2b_fetchbody import _fetch, _public


def test_internal_and_non_http_targets_are_refused():
    for url in ("http://127.0.0.1:3001/", "http://169.254.169.254/latest/meta-data/",
                "http://10.0.1.7:5432/", "http://localhost/", "file:///etc/passwd",
                "javascript:alert(1)"):
        assert not _public(url), url
        assert _fetch(url) is None, url
