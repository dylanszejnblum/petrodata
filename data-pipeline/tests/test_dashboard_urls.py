import dashboard


def _render(source_url: str, image_url: str) -> str:
    doc = {"doc_id": "x", "title": "t", "source_url": source_url,
           "attachments": [{"type": "image", "url": image_url}]}
    return dashboard.render_doc({"docs": [doc]}, "x")


def test_feed_urls_without_http_scheme_are_not_rendered():
    html = _render("javascript:alert(1)", "javascript:alert(2)")
    assert "javascript:" not in html


def test_http_urls_are_rendered():
    html = _render("https://ok.com/a", "https://ok.com/b.png")
    assert "https://ok.com/a" in html and "https://ok.com/b.png" in html
