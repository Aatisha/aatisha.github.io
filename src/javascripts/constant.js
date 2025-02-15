export const BLOG_CARD_TEMPLATE = `<div class="u-displayFlex u-alignItems-stretch u-marginV10 col-md-4 col-sm-6">
            <div class="blog-card u-boxShadow3">
              <div class="blog-card__image">
                <img src="{blogImage}" alt="{blogImageAlt}">
                <div class="share">
                  <input class="share-menu__trigger" type="checkbox" id="share-menu-trigger{triggerIndex}"/>
                  <div class="share-menu">
                    <label class="share-menu__btn" for="share-menu-trigger{triggerIndex}">
                      <!-- <i class="share-menu__btn-icon fa-solid fa-share-nodes"></i> -->
                      <i class="share-menu__btn-icon fa-solid fa-arrow-up-from-bracket"></i>
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
              <div class="blog-card__content">
                <div class="blog-card__categories">
                  <span class="category">{firstCategory}</span>
                  <span class="category">{secondCategory}</span>
                </div>
                <h2 class="blog-card__title">{blogTitle}</h2>
                <p class="blog-card__description">
                  {blogContent}
                </p>
                <div class="blog-card__footer">
                  <div class="blog-metrics">
                    <div class="blog-info">{datePublished}</div>
                    <div class="claps">
                      <i class="fa-solid fa-hands-clapping"></i>
                      {clapCount}
                    </div>
                    <!--<div class="comments">
                      <i class="fa-solid fa-comment"></i>
                      {commentCount}
                    </div>-->
                  </div>
                  <div class="open-blog">
                    <a href="{blogUrl}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                  </div>
                </div>
              </div>
            </div>
          </div>`;

export const MEDIUM_USERNAME = '@cyrillaatisha';
export const STARRED_BLOG_ID = '17befb37e735';

export class BlogTemplateProperties {
  constructor(blogImage, blogImageAlt, blogTitle, datePublished, clapCount,
    commentCount, triggerIndex, mediumShareBaseUrl, blogUrl, blogContent,
    firstCategory, secondCategory) {
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
    this.firstCategory = firstCategory;
    this.secondCategory = secondCategory;
  }
}

const TECH_BASE_PATH = '/tech';

export const URL_PATHS = {
  home: '/',
  about: '/about',
  contact: '/contact',
  blog: '/blog',
  deal_management: '/deal-management',
  design_work: '/design-work',
  literati_women: '/literati-women',
  online_assessment: '/online-assessment',
  plant_health: '/plant-health',
  trader_joes: '/trader-joes',
  minds: '/minds',
  ux_research: '/ux-research',
  sustainable_ux: '/sustainable-ux',
  ssec_products: '/ssec-products',
  rover_usability_study: '/rover-usability-study',
  amazon_shopbop: '/amazon-shopbop',
  tech: {
    home: TECH_BASE_PATH,
    about: `${TECH_BASE_PATH}/about`,
    contact: `${TECH_BASE_PATH}/contact`,
    deal_management: `${TECH_BASE_PATH}/deal-management`,
    online_assessment: `${TECH_BASE_PATH}/online-assessment`,
    plant_health: `${TECH_BASE_PATH}/plant-health`,
  },
};

export const DESIGN_ARTICLE_NAVS = [
  {
    name: 'Amazon Shopbop - App Design For Social Recommendations',
    shortName: 'Amazon Shopbop',
    path: URL_PATHS.amazon_shopbop,
    class: 'amazon_shopbop_color',
  },
  {
    name: 'Sustain Dane - App Design For Environmental Good',
    shortName: 'Sustain Dane',
    path: URL_PATHS.sustainable_ux,
    class: 'sustainable_ux_color',
  },
  {
    name: 'SSEC\'s Products Platform',
    shortName: 'SSEC',
    path: URL_PATHS.ssec_products,
    class: 'ssec_products_color',
  },
  {
    name: 'Trader Joe\'s - User Research Plan',
    shortName: 'Trader Joe\'s',
    path: URL_PATHS.trader_joes,
    class: 'trader_joes_color',
  },
  {
    name: 'MINDS',
    shortName: 'MINDS',
    path: URL_PATHS.minds,
    class: 'minds_color',
  },
  {
    name: 'Rover Website - Usability Study',
    shortName: 'Rover Website',
    path: URL_PATHS.rover_usability_study,
    class: 'usability_study_rover_color',
  },
  // {
  //   name: 'Literati Women',
  //   path: URL_PATHS.literati_women,
  //   class: 'literati_women_color',
  // },
  // {
  //   name: 'UX Research',
  //   path: URL_PATHS.ux_research,
  //   class: 'ux_research_color',
  // },
  // {
  //   name: 'University Design Work',
  //   path: URL_PATHS.design_work,
  //   class: 'design_work_color',
  // },
];

export function isTechPath() {
  return window.location.href.includes(TECH_BASE_PATH);
}

export const DEV_ARTICLE_NAVS = [
  {
    name: 'Online Assessment',
    shortName: 'Online Assessment',
    path: (isTechPath()) ? URL_PATHS.tech.online_assessment : URL_PATHS.online_assessment,
    // tech_path: URL_PATHS.tech.online_assessment,
    class: 'online_assessment_color',
  },
  {
    name: 'Plant health monitoring',
    shortName: 'Plant Health',
    path: (isTechPath()) ? URL_PATHS.tech.plant_health : URL_PATHS.plant_health,
    // tech_path: URL_PATHS.tech.plant_health,
    class: 'plant_health_color',
  },
  {
    name: 'Deal management',
    shortName: 'Deal Management',
    path: (isTechPath()) ? URL_PATHS.tech.deal_management : URL_PATHS.deal_management,
    // tech_path: URL_PATHS.tech.deal_management,
    class: 'deal_management_color',
  },
];

export const DESIGN_URLS = DESIGN_ARTICLE_NAVS.map((nav) => nav.path);
export const DEV_URLS = DEV_ARTICLE_NAVS.map((nav) => nav.path);
export const WORK_DROPDOWN_ITEMS = DESIGN_ARTICLE_NAVS;
