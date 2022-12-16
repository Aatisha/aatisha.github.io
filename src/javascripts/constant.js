export const BLOG_SLIDE_TEMPLATE = `<div class="blog-slider__item swiper-slide">
<div class="blog-slider__img">
  <img
    src="{blogImage}"
    alt="{blogImageAlt}"/>
</div>
<div class="blog-slider__content">
  <div class="blog-slider__title">{blogTitle}</div>
  <div class="blog-slider__code u-displayFlex u-alignItems-center u-justify-spaceBetween">
    <div class="blog-slider-info">{datePublished}</div>
    <div class="blog-slider-metrics">
      <div class="claps">
        <i class="fa-solid fa-hands-clapping"></i>
        {clapCount}
      </div>
      <div class="comments">
        <i class="fa-solid fa-comment"></i>
        {commentCount}
      </div>
      <div class="share">
        <input class="share-menu__trigger" type="checkbox" id="share-menu-trigger{triggerIndex}"/>
        <div class="share-menu">
          <label class="share-menu__btn" for="share-menu-trigger{triggerIndex}">
            <i class="share-menu__btn-icon fa-solid fa-share-nodes"></i>
          </label>
          <div class="share-menu__list">
            <div class="share-menu__item">
              <a href="{mediumShareBaseUrl}/share/linkedIn" target="_blank" class="share-menu__link" for="share-menu-trigger{triggerIndex}">
                <i class="share-menu__icon fa-brands fa-linkedin-in"></i>
              </a>
              <span class="share-menu__tip">Share to LinkedIn</span>
            </div>
            <div class="share-menu__item">
              <a href="{mediumShareBaseUrl}/share/facebook" target="_blank" class="share-menu__link" for="share-menu-trigger{triggerIndex}">
                <i class="share-menu__icon fa-brands fa-facebook-f"></i>
              </a>
              <span class="share-menu__tip">Share to Facebook</span>
            </div>
            <div class="share-menu__item">
              <a href="{mediumShareBaseUrl}/share/twitter" target="_blank" class="share-menu__link" for="share-menu-trigger{triggerIndex}">
                <i class="share-menu__icon fa-brands fa-twitter"></i>
              </a>
              <span class="share-menu__tip">Share to Twitter</span>
            </div>
            <div class="share-menu__item">
              <a href="mailto:?subject=Checkout this blog &amp;body=Hey!%20%0AI came across this blog by Aatisha Cyrill. Do give it a read.%20%0ALink -> {blogUrl}"
                class="share-menu__link" for="share-menu-trigger" target="_blank">
                <i class="share-menu__icon  fa-solid fa-envelope"></i>
              </a>
              <span class="share-menu__tip">Send by Email</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="blog-slider__text">{blogContent}</div>
  <div class="u-displayFlex u-alignItems-center u-justify-end">
    <a href="{blogUrl}" target="_blank" class="blog-slider__button">READ MORE</a>
  </div>
</div>
</div>`;

export const MEDIUM_USERNAME = '@cyrillaatisha';

export class BlogTemplateProperties {
  constructor(blogImage, blogImageAlt, blogTitle, datePublished, clapCount,
    commentCount, triggerIndex, mediumShareBaseUrl, blogUrl, blogContent) {
    this.blogImage = blogImage;
    this.blogImageAlt = blogImageAlt;
    this.blogTitle = blogTitle;
    this.datePublished = datePublished;
    this.clapCount = clapCount;
    this.commentCount = commentCount;
    this.triggerIndex = triggerIndex;
    this.mediumShareBaseUrl = mediumShareBaseUrl;
    this.blogUrl = blogUrl;
    this.blogContent = blogContent;
  }
}
