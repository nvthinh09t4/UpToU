using Microsoft.EntityFrameworkCore;
using UpToU.Core.Entities;
using UpToU.Infrastructure.Data;

namespace UpToU.Infrastructure.Seed;

/// <summary>
/// Seeds the "Investment Crisis: 50 Choices" interactive story.
/// Score keys: capital (V), experience (K), mental (T), health (S).
/// </summary>
public static class InvestmentCrisisStorySeeder
{
    private const string StorySlug = "investment-crisis-50-choices";

    public static async Task SeedAsync(ApplicationDbContext db, List<Category> categories)
    {
        if (await db.Stories.IgnoreQueryFilters().AnyAsync(s => s.Slug == StorySlug))
            return;

        var investCat = categories.FirstOrDefault(c => c.Title == "Investment")
            ?? throw new InvalidOperationException("Investment category not found. Run SeedCategoriesAsync first.");

        var now = DateTime.UtcNow;
        const string by = "system";

        // ── Node definitions ─────────────────────────────────────────────────
        // Each element: (questionEn, subtitleEn, questionVi, subtitleVi, bgColor, anim)
        var nodeDefs = new (string Q, string? Sub, string QVi, string? SubVi, string Bg, string? Anim)[]
        {
            // Phase 1: The Storm Forms (Q1-10) — dark blue
            ("Morning news reports an energy crisis: oil crosses $120, inflation spikes. What do you do first?",
             "Every storm starts with a headline.",
             "Tin tức buổi sáng về khủng hoảng năng lượng. Giá dầu vượt 120 USD, lạm phát tăng. Bạn làm gì đầu tiên?",
             "Mọi cơn bão đều bắt đầu từ một tin tức.",
             "#1e3a5f", "fade"),

            ("Transportation costs have surged. Your daily commute is noticeably more expensive.",
             "Small costs compound into big problems.",
             "Chi phí đi lại tăng mạnh. Chi phí đi lại hàng ngày của bạn đắt hơn rõ rệt.",
             "Chi phí nhỏ tích lũy thành vấn đề lớn.",
             "#1a3356", "slide-left"),

            ("The stock market drops 15% in a single week. Your portfolio is bleeding.",
             "Panic is a strategy — just a terrible one.",
             "Thị trường chứng khoán giảm 15% trong một tuần. Danh mục của bạn đang thua lỗ.",
             "Hoảng loạn cũng là một chiến lược — chỉ là một chiến lược tệ hại.",
             "#162a45", "zoom"),

            ("Your company cuts all allowances due to budget pressure.",
             "How you respond to loss matters as much as the loss itself.",
             "Công ty cắt giảm toàn bộ phụ cấp do áp lực ngân sách.",
             "Cách bạn phản ứng với mất mát quan trọng không kém bản thân mất mát đó.",
             "#1e3a5f", "fade"),

            ("Food prices rise 20%. Your grocery bill has jumped significantly.",
             "What you eat shapes more than your body.",
             "Giá thực phẩm tăng 20%. Hóa đơn thực phẩm của bạn tăng đáng kể.",
             "Những gì bạn ăn định hình nhiều hơn chỉ là cơ thể bạn.",
             "#1a3356", "slide-left"),

            ("A rumor spreads about a high-yield crypto platform promising 50% monthly returns.",
             "If it sounds too good to be true…",
             "Tin đồn lan truyền về một sàn crypto lợi nhuận cao, hứa hẹn 50%/tháng.",
             "Nếu nghe có vẻ quá tốt để là sự thật...",
             "#162a45", "zoom"),

            ("The central bank raises interest rates sharply to fight inflation.",
             "Rising rates change every calculation.",
             "Ngân hàng trung ương tăng lãi suất mạnh để chống lạm phát.",
             "Lãi suất tăng thay đổi mọi tính toán.",
             "#1e3a5f", "fade"),

            ("Financial stress is mounting. You haven't slept well in weeks.",
             "The mind is an asset too.",
             "Áp lực tài chính đang gia tăng. Bạn không ngủ ngon trong nhiều tuần.",
             "Tâm trí cũng là một tài sản.",
             "#1a3356", "slide-left"),

            ("A trusted friend urgently needs to sell their land below market value due to cash flow issues.",
             "Opportunity and obligation can look identical.",
             "Một người bạn tin cậy cần bán đất gấp dưới giá thị trường do vấn đề dòng tiền.",
             "Cơ hội và trách nhiệm đôi khi trông giống hệt nhau.",
             "#162a45", "zoom"),

            ("You fall mildly ill from chronic overwork and sleep deprivation.",
             "The body keeps score.",
             "Bạn bị ốm nhẹ do làm việc quá sức và thiếu ngủ kéo dài.",
             "Cơ thể luôn ghi nhớ mọi thứ.",
             "#1e3a5f", "fade"),

            // Phase 2: Tightening the Belt (Q11-20) — dark purple
            ("Your salary is officially cut by 20%. New payslip just landed in your inbox.",
             "Adapt or struggle — there is no third option.",
             "Lương của bạn chính thức bị cắt 20%. Bảng lương mới vừa vào hộp thư.",
             "Thích nghi hay vật lộn — không có lựa chọn thứ ba.",
             "#2d1b4e", "fade"),

            ("Your family in the countryside calls — they urgently need financial help.",
             "The hardest decisions involve people you love.",
             "Gia đình ở quê gọi điện — họ cần hỗ trợ tài chính gấp.",
             "Những quyết định khó nhất liên quan đến những người bạn yêu thương.",
             "#261542", "slide-left"),

            ("Gold prices are swinging wildly. Your gold holdings are up 20% today, down 15% tomorrow.",
             "Volatility rewards the decisive — or punishes the impulsive.",
             "Giá vàng biến động dữ dội. Vàng của bạn hôm nay tăng 20%, ngày mai giảm 15%.",
             "Biến động thưởng cho người quyết đoán — hoặc phạt kẻ bốc đồng.",
             "#2d1b4e", "zoom"),

            ("A colleague proposes launching a startup together during the economic downturn.",
             "Crises have created many of the world's greatest companies.",
             "Một đồng nghiệp đề xuất cùng khởi nghiệp trong lúc kinh tế khó khăn.",
             "Khủng hoảng đã tạo ra nhiều công ty vĩ đại nhất thế giới.",
             "#261542", "fade"),

            ("Your savings account has matured. The bank offers renewal or withdrawal.",
             "Money sitting still is not money resting — it's money deciding.",
             "Sổ tiết kiệm của bạn đến hạn. Ngân hàng đề xuất tái tục hoặc rút tiền.",
             "Tiền đứng yên không phải tiền nghỉ ngơi — đó là tiền đang chờ quyết định.",
             "#2d1b4e", "slide-left"),

            ("Your laptop breaks down completely. You need it to work.",
             "A tool is only as good as the decision to maintain it.",
             "Laptop của bạn hỏng hoàn toàn. Bạn cần nó để làm việc.",
             "Một công cụ chỉ tốt bằng quyết định bảo trì nó.",
             "#261542", "zoom"),

            ("Your portfolio has now fallen 45% from its peak. The bleeding continues.",
             "Every investor faces this moment eventually.",
             "Danh mục đầu tư của bạn đã giảm 45% so với đỉnh. Thua lỗ vẫn tiếp diễn.",
             "Mọi nhà đầu tư đều phải đối mặt với khoảnh khắc này.",
             "#2d1b4e", "fade"),

            ("Your partner confronts you about the financial pressure affecting your relationship.",
             "Shared problems require shared solutions.",
             "Người bạn đời đối diện với bạn về áp lực tài chính đang ảnh hưởng đến mối quan hệ.",
             "Vấn đề chung đòi hỏi giải pháp chung.",
             "#261542", "slide-left"),

            ("A highly-rated financial course is on sale at 70% off. Limited time only.",
             "The best time to learn is when it hurts most.",
             "Một khóa học tài chính được đánh giá cao đang giảm 70%. Chỉ trong thời gian giới hạn.",
             "Thời điểm tốt nhất để học là khi đau đớn nhất.",
             "#2d1b4e", "zoom"),

            ("Your body is exhausted. Persistent headaches, fatigue, no energy.",
             "You cannot pour from an empty cup.",
             "Cơ thể bạn kiệt sức. Đau đầu dai dẳng, mệt mỏi, không còn năng lượng.",
             "Bạn không thể rót từ một chiếc cốc rỗng.",
             "#261542", "fade"),

            // Phase 3: Rock Bottom (Q21-30) — dark red
            ("Your company files for bankruptcy. You are now unemployed.",
             "The ground has given way. What do you build on?",
             "Công ty bạn đang làm tuyên bố phá sản. Bạn hiện đang thất nghiệp.",
             "Nền móng đã sụp đổ. Bạn sẽ xây dựng trên gì?",
             "#4a1a1a", "fade"),

            ("Your bank loan payment is due and you simply don't have the money.",
             "Debt does not care about your circumstances.",
             "Khoản nợ ngân hàng đến hạn và bạn đơn giản là không có tiền.",
             "Nợ không quan tâm đến hoàn cảnh của bạn.",
             "#3d1515", "slide-left"),

            ("The market is flooded with 'distressed' assets — properties and stocks at historic lows.",
             "Fortunes are made in downturns. But only by those with capital and nerve.",
             "Thị trường tràn ngập tài sản 'ngộp' — bất động sản và cổ phiếu ở mức thấp lịch sử.",
             "Tài sản được tạo ra trong suy thoái. Nhưng chỉ bởi những người có vốn và thần kinh thép.",
             "#4a1a1a", "zoom"),

            ("The weight of failure crushes you. You want to stop fighting.",
             "Darkness tests what light remains.",
             "Cảm giác thất bại đang đè nặng. Bạn muốn buông xuôi.",
             "Bóng tối kiểm tra ánh sáng còn lại.",
             "#3d1515", "fade"),

            ("News breaks: inflation has peaked and shows early signs of declining.",
             "Is this the turn — or just a false dawn?",
             "Tin tức: lạm phát đã đạt đỉnh và có dấu hiệu giảm sớm.",
             "Đây có phải là bước ngoặt — hay chỉ là bình minh giả?",
             "#4a1a1a", "slide-left"),

            ("Someone approaches you with an offer to join an illegal smuggling operation.",
             "Desperation has its own logic. But so does consequence.",
             "Có người tiếp cận bạn với đề nghị tham gia đường dây buôn lậu bất hợp pháp.",
             "Tuyệt vọng có logic riêng của nó. Nhưng hậu quả cũng vậy.",
             "#3d1515", "zoom"),

            ("You can no longer afford your apartment. You must find a cheaper place or move.",
             "Home is more than shelter — but shelter still matters.",
             "Bạn không còn đủ tiền thuê căn hộ hiện tại. Bạn phải tìm nơi rẻ hơn hoặc chuyển đi.",
             "Ngôi nhà không chỉ là nơi trú ẩn — nhưng nơi trú ẩn vẫn quan trọng.",
             "#4a1a1a", "fade"),

            ("Severe toothache has become unbearable. You've been ignoring it for weeks.",
             "Deferred care always costs more.",
             "Đau răng nặng đã trở nên không chịu được. Bạn đã bỏ qua nó nhiều tuần.",
             "Chăm sóc trì hoãn luôn tốn kém hơn.",
             "#3d1515", "slide-left"),

            ("An old friend from a better time has just made a fortune through speculation.",
             "Their win is not your loss — unless you let it be.",
             "Một người bạn cũ từ thời tốt đẹp hơn vừa phất lên nhờ đầu cơ.",
             "Chiến thắng của họ không phải thất bại của bạn — trừ khi bạn để nó như vậy.",
             "#4a1a1a", "zoom"),

            ("You've just calculated it: you've lost 70% of your net worth over two years.",
             "This is the defining moment. Who are you when everything is gone?",
             "Bạn vừa tính toán lại: bạn đã mất 70% tài sản ròng trong hai năm.",
             "Đây là khoảnh khắc định nghĩa. Bạn là ai khi mọi thứ đều mất?",
             "#3d1515", "fade"),

            // Phase 4: Light at End of Tunnel (Q31-40) — dark green
            ("You land a new job — the salary is actually better than your pre-crisis role.",
             "Recovery begins with a single step forward.",
             "Bạn có được việc làm mới — mức lương thực ra tốt hơn vị trí trước khủng hoảng.",
             "Sự hồi phục bắt đầu từ một bước đi đầu tiên.",
             "#1a3a2a", "fade"),

            ("Your investment positions finally show a small profit for the first time in months.",
             "Green after red. Hold, sell, or split?",
             "Các vị thế đầu tư của bạn cuối cùng cho thấy lợi nhuận nhỏ lần đầu tiên sau nhiều tháng.",
             "Xanh sau đỏ. Giữ, bán, hay chia?",
             "#163322", "slide-left"),

            ("An unexpected year-end bonus arrives in your account.",
             "Windfall decisions reveal your true financial philosophy.",
             "Một khoản thưởng cuối năm bất ngờ xuất hiện trong tài khoản của bạn.",
             "Quyết định với tiền bất ngờ tiết lộ triết lý tài chính thực sự của bạn.",
             "#1a3a2a", "zoom"),

            ("The real estate market is heating up again. Prices rising weekly.",
             "Is this recovery — or another bubble?",
             "Thị trường bất động sản đang nóng lại. Giá tăng hàng tuần.",
             "Đây là sự phục hồi — hay là bong bóng khác?",
             "#163322", "fade"),

            ("You run into people from the darkest days of the crisis.",
             "Scars are both wounds and wisdom.",
             "Bạn gặp lại những người từ những ngày đen tối nhất của cuộc khủng hoảng.",
             "Vết thương vừa là tổn thương vừa là trí tuệ.",
             "#1a3a2a", "slide-left"),

            ("An AI-powered investment platform launches, promising data-driven returns.",
             "Technology changes the game. Does it change the player?",
             "Một nền tảng đầu tư hỗ trợ AI ra mắt, hứa hẹn lợi nhuận dựa trên dữ liệu.",
             "Công nghệ thay đổi cuộc chơi. Nó có thay đổi người chơi không?",
             "#163322", "zoom"),

            ("You're offered a promotion to team manager with a significant pay raise.",
             "More reward almost always means more responsibility.",
             "Bạn được đề xuất thăng chức lên quản lý nhóm với mức tăng lương đáng kể.",
             "Phần thưởng nhiều hơn hầu như luôn đồng nghĩa với trách nhiệm nhiều hơn.",
             "#1a3a2a", "fade"),

            ("Your body is showing signs of recovery — more energy, fewer aches.",
             "The body remembers how to be well, if given the chance.",
             "Cơ thể bạn đang cho thấy dấu hiệu hồi phục — năng lượng hơn, ít đau nhức hơn.",
             "Cơ thể nhớ cách khỏe mạnh, nếu được cho cơ hội.",
             "#163322", "slide-left"),

            ("A new market frenzy is building — everyone is chasing a hot new asset.",
             "The crowd is not always wrong. But it is never the first to arrive.",
             "Một cơn sốt thị trường mới đang hình thành — mọi người đang đổ xô vào tài sản nóng.",
             "Đám đông không phải lúc nào cũng sai. Nhưng họ không bao giờ là người đến đầu tiên.",
             "#1a3a2a", "zoom"),

            ("You run the numbers: your portfolio has fully recovered to its pre-crisis value.",
             "The journey back is complete. Now what?",
             "Bạn tính toán lại: danh mục đầu tư của bạn đã hồi phục hoàn toàn về giá trị trước khủng hoảng.",
             "Hành trình trở lại đã hoàn thành. Bây giờ thì sao?",
             "#163322", "fade"),

            // Phase 5: Identity (Q41-50) — dark gold
            ("Young investors seek you out for advice. Your experience is now a resource.",
             "The crisis cost you. Now it pays dividends.",
             "Các nhà đầu tư trẻ tìm đến bạn để xin lời khuyên. Kinh nghiệm của bạn giờ là tài nguyên.",
             "Khủng hoảng đã tốn kém với bạn. Bây giờ nó trả cổ tức.",
             "#3a2a1a", "fade"),

            ("You feel compelled to document your journey — a book, a blog, something lasting.",
             "Those who write their story shape how it's remembered.",
             "Bạn cảm thấy cần ghi lại hành trình của mình — một cuốn sách, blog, điều gì đó lâu dài.",
             "Những người viết câu chuyện của họ định hình cách nó được ghi nhớ.",
             "#2d2015", "slide-left"),

            ("Small signs of a new economic downturn are emerging. Sound familiar?",
             "The second time, you know what's coming.",
             "Những dấu hiệu nhỏ của suy thoái kinh tế mới đang xuất hiện. Nghe quen không?",
             "Lần thứ hai, bạn biết điều gì sắp xảy ra.",
             "#3a2a1a", "zoom"),

            ("Your family hasn't had a proper vacation in years. They want to travel abroad.",
             "Money is a tool. What is it for?",
             "Gia đình bạn chưa có kỳ nghỉ đúng nghĩa trong nhiều năm. Họ muốn du lịch nước ngoài.",
             "Tiền là công cụ. Nó dùng để làm gì?",
             "#2d2015", "fade"),

            ("FIRE (Financial Independence, Retire Early) is suddenly within reach.",
             "Freedom has a price. So does another decade of work.",
             "FIRE (Tự do tài chính, nghỉ hưu sớm) bỗng nhiên nằm trong tầm tay.",
             "Tự do có giá của nó. Và một thập kỷ làm việc nữa cũng vậy.",
             "#3a2a1a", "slide-left"),

            ("Your eyesight is deteriorating from years of screen-heavy work.",
             "The costs of productivity compound over decades.",
             "Thị lực của bạn đang suy giảm do nhiều năm làm việc nhiều với màn hình.",
             "Chi phí của năng suất tích lũy theo thập kỷ.",
             "#2d2015", "zoom"),

            ("You encounter the person who defrauded you years ago at a professional event.",
             "How you respond to past wrongs defines who you've become.",
             "Bạn gặp lại người đã lừa đảo bạn nhiều năm trước tại một sự kiện chuyên nghiệp.",
             "Cách bạn phản ứng với những sai trái trong quá khứ định nghĩa bạn đã trở thành ai.",
             "#3a2a1a", "fade"),

            ("You decide to donate a meaningful portion of your wealth.",
             "Wealth changes meaning when shared.",
             "Bạn quyết định quyên góp một phần đáng kể tài sản của mình.",
             "Tài sản thay đổi ý nghĩa khi được chia sẻ.",
             "#2d2015", "slide-left"),

            ("Looking in the mirror after everything you've been through.",
             "The storm is over. Who survived it?",
             "Nhìn vào gương sau tất cả những gì bạn đã trải qua.",
             "Cơn bão đã qua. Ai đã vượt qua nó?",
             "#3a2a1a", "zoom"),

            ("Final question: How do you define success after everything?",
             "Your answer now is not the same as before the storm.",
             "Câu hỏi cuối cùng: Bạn định nghĩa thành công là gì sau tất cả?",
             "Câu trả lời của bạn bây giờ không giống như trước cơn bão.",
             "#2d2015", "fade"),
        };

        // ── Answer definitions (EN text, VI text, score deltas V/K/T/S, isEndNode) ──
        // isEndNode: true forces NextNodeId = null regardless of position
        var answerDefs = new (string En, string Vi, int V, int K, int T, int S, bool End)[][]
        {
            // Q1
            [("Withdraw 30% of savings to buy gold.",
              "Rút 30% tiết kiệm mua vàng.",
              -10, 10, 10, 0, false),
             ("Hold cash and wait.",
              "Giữ tiền mặt, chờ đợi.",
              5, 0, 5, 0, false),
             ("Borrow more to buy oil & gas stocks.",
              "Vay thêm mua cổ phiếu dầu khí.",
              20, 15, -20, -10, false)],
            // Q2
            [("Sell your car and switch to public transport.",
              "Bán xe cá nhân, đi phương tiện công cộng.",
              20, 0, -10, -5, false),
             ("Keep the old car and cut café and entertainment costs.",
              "Vẫn đi xe cũ, cắt giảm chi phí cafe, giải trí.",
              5, 0, -10, 5, false),
             ("Upgrade to an electric car for long-term savings.",
              "Nâng cấp lên xe điện để tiết kiệm lâu dài.",
              -30, 10, 0, 5, false)],
            // Q3
            [("Panic-sell everything.",
              "Bán tháo toàn bộ.",
              -20, 0, -10, 0, false),
             ("Hold positions — stop watching the board.",
              "Giữ nguyên, không xem bảng điện.",
              0, 0, 10, 0, false),
             ("Buy more using your emergency reserve.",
              "Mua thêm bằng tiền dự phòng.",
              -20, 15, -10, 0, false)],
            // Q4
            [("Work overtime to compensate.",
              "Làm thêm giờ để bù thu nhập.",
              10, 0, 0, -20, false),
             ("Learn a new skill in the evenings.",
              "Học thêm một kỹ năng mới buổi tối.",
              -5, 20, 0, -10, false),
             ("Protest, leading to tension with your boss.",
              "Phản đối, dẫn đến căng thẳng với sếp.",
              0, 0, -15, -5, false)],
            // Q5
            [("Switch to cheap fast food.",
              "Chuyển sang ăn đồ ăn nhanh, rẻ tiền.",
              10, 0, 0, -20, false),
             ("Cook at home — control portions and calories.",
              "Tự nấu ăn tại nhà, kiểm soát calo.",
              5, 0, -5, 10, false),
             ("Continue eating as usual — accept the higher cost.",
              "Tiếp tục ăn uống như cũ, chấp nhận chi nhiều hơn.",
              -15, 0, 5, 0, false)],
            // Q6
            [("Put 10% of your capital in — a calculated bet.",
              "Bỏ 10% vốn vào cầu may.",
              -10, 10, -10, 0, false),
             ("Ignore it and focus on traditional assets.",
              "Bỏ qua, tập trung tài sản truyền thống.",
              0, 0, 10, 0, false),
             ("Research the underlying technology thoroughly before deciding.",
              "Tìm hiểu kỹ công nghệ đằng sau nó trước khi quyết định.",
              0, 15, 0, -5, false)],
            // Q7
            [("Pay off bank debt as fast as possible.",
              "Trả nợ ngân hàng sớm nhất có thể.",
              -30, 0, 20, 0, false),
             ("Accept higher interest to keep your business capital intact.",
              "Chấp nhận trả lãi cao để giữ vốn kinh doanh.",
              -10, 10, 0, 0, false),
             ("Deposit more into savings to lock in the higher rate.",
              "Gửi thêm tiền vào tiết kiệm để khóa lãi suất cao hơn.",
              -20, 0, 5, 0, false)],
            // Q8
            [("Go out drinking with friends to blow off steam.",
              "Đi nhậu với bạn bè để giải tỏa.",
              -5, 0, 10, -10, false),
             ("Start running every morning.",
              "Đi chạy bộ mỗi sáng.",
              0, 0, 5, 20, false),
             ("Buy a meditation and yoga course.",
              "Mua khóa học thiền và yoga.",
              -10, 0, 15, 10, false)],
            // Q9
            [("Pour in your remaining capital to buy immediately.",
              "Dồn vốn mua ngay.",
              -50, 20, -20, 0, false),
             ("Decline — the liquidity risk is too high.",
              "Từ chối vì tính thanh khoản thấp.",
              0, 0, 10, 0, false),
             ("Act as a broker for someone else and earn a commission.",
              "Môi giới cho người khác để lấy hoa hồng.",
              10, 10, 0, -10, false)],
            // Q10
            [("Rest for 3 days — do absolutely nothing.",
              "Nghỉ ngơi 3 ngày không làm gì.",
              -5, 0, 5, 20, false),
             ("Take medicine and keep working.",
              "Vừa uống thuốc vừa làm việc.",
              5, 0, 0, -20, false),
             ("Get a full health checkup for peace of mind.",
              "Đi khám tổng quát để an tâm.",
              -10, 0, 0, 30, false)],
            // Q11
            [("Find freelance gigs to work in the evenings.",
              "Tìm việc Freelance ban đêm.",
              15, 0, 0, -25, false),
             ("Cancel all streaming, gym, and subscription services.",
              "Cắt giảm toàn bộ đăng ký Netflix, Gym, Spotify.",
              5, 0, -10, 0, false),
             ("Accept a simpler, leaner lifestyle.",
              "Chấp nhận sống tằn tiện hơn.",
              -5, 0, -5, 0, false)],
            // Q12
            [("Send a large sum to help without hesitation.",
              "Gửi số tiền lớn giúp đỡ.",
              -30, 0, 20, 0, false),
             ("Send a little and honestly explain your own difficulties.",
              "Gửi một ít và giải thích hoàn cảnh khó khăn.",
              -10, 0, -10, 0, false),
             ("Politely decline and explain you cannot help right now.",
              "Từ chối khéo và giải thích bạn không thể giúp lúc này.",
              10, 0, -30, 0, false)],
            // Q13
            [("Sell all gold for cash.",
              "Bán vàng lấy tiền mặt.",
              20, -5, -10, 0, false),
             ("Buy more gold — fearing further currency devaluation.",
              "Mua thêm vàng vì sợ tiền mất giá.",
              -20, 10, 5, 0, false),
             ("Exchange gold for US dollars for stability.",
              "Đổi vàng lấy đô la Mỹ cho sự ổn định.",
              0, 5, 5, 0, false)],
            // Q14
            [("Invest capital and build it together.",
              "Góp vốn và cùng làm.",
              -40, 30, -10, 0, false),
             ("Only offer professional advice — no capital commitment.",
              "Chỉ hỗ trợ tư vấn chuyên môn — không cam kết vốn.",
              0, 10, 0, -5, false),
             ("Decline — focus on keeping your current job.",
              "Từ chối, tập trung giữ việc hiện tại.",
              0, 0, 5, 0, false)],
            // Q15
            [("Renew the savings account at the higher interest rate.",
              "Tái tục với lãi suất cao hơn.",
              5, 0, 10, 0, false),
             ("Withdraw and buy cheap stocks while they're down.",
              "Rút ra mua cổ phiếu giá rẻ.",
              -20, 20, -15, 0, false),
             ("Withdraw and keep cash at home for security.",
              "Rút ra giữ tiền mặt trong nhà cho an toàn.",
              -5, 0, 5, 0, false)],
            // Q16
            [("Buy a used device as a temporary fix.",
              "Mua đồ cũ dùng tạm.",
              -5, 0, -10, -5, false),
             ("Buy the best new model to maximize productivity.",
              "Mua đồ mới xịn nhất để làm việc hiệu quả.",
              -20, 10, 0, 10, false),
             ("Repair it yourself to save money.",
              "Tự sửa chữa để tiết kiệm.",
              0, 5, 0, -10, false)],
            // Q17
            [("Cut your losses to preserve remaining capital.",
              "Cắt lỗ để bảo toàn vốn còn lại.",
              -40, 10, -20, 0, false),
             ("Ignore it — delete the app and stop watching.",
              "Mặc kệ, xóa app không xem nữa.",
              0, 0, 15, 0, false),
             ("Borrow from relatives to 'average down' your position.",
              "Vay người thân để 'trung bình giá'.",
              -20, 15, -30, 0, false)],
            // Q18
            [("Suffer in silence alone.",
              "Im lặng chịu đựng một mình.",
              0, 0, -20, -10, false),
             ("Share openly and build a joint spending plan together.",
              "Chia sẻ thẳng thắn và cùng lập kế hoạch chi tiêu.",
              0, 5, 10, 0, false),
             ("Argue, leading to serious cracks in the relationship.",
              "Cãi nhau, dẫn đến rạn nứt nghiêm trọng.",
              0, 0, -30, -20, false)],
            // Q19
            [("Buy immediately to build financial knowledge.",
              "Mua ngay để nâng cao kiến thức tài chính.",
              -5, 25, 0, 0, false),
             ("Self-study online for free instead.",
              "Tự học trên mạng miễn phí.",
              0, 15, 0, -10, false),
             ("Skip it — you need money right now, not learning.",
              "Bỏ qua, giờ chỉ cần tiền không cần học.",
              0, -5, 0, 0, false)],
            // Q20
            [("Spend on a short resort vacation to recharge.",
              "Bỏ ra khoản tiền lớn đi nghỉ dưỡng ngắn ngày.",
              -20, 0, 20, 30, false),
             ("Just sleep more on weekends.",
              "Chỉ ngủ nhiều hơn vào cuối tuần.",
              0, 0, 0, 10, false),
             ("Drink energy drinks and strong coffee to push through.",
              "Uống bò húc và cafe đặc để tỉnh táo làm việc.",
              5, 0, 0, -20, false)],
            // Q21
            [("Live off unemployment benefits while planning.",
              "Dùng tiền trợ cấp thất nghiệp để sống qua ngày.",
              10, 0, -20, 0, false),
             ("Start driving for a rideshare or delivery service immediately.",
              "Chạy Grab và giao hàng ngay lập tức.",
              15, 0, -10, -30, false),
             ("Use this time to research the market intensively.",
              "Dùng thời gian này nghiên cứu thị trường toàn lực.",
              -10, 40, 0, -10, false)],
            // Q22
            [("Sell remaining assets at rock-bottom prices to clear the debt.",
              "Bán tài sản giá rẻ mạt để trả nợ.",
              -50, 10, -30, 0, false),
             ("Negotiate a debt extension with the bank.",
              "Thương lượng gia hạn nợ với ngân hàng.",
              0, 5, -15, 0, false),
             ("Borrow from a loan shark — you're desperate. (Very dangerous.)",
              "Vay tín dụng đen — bạn đang tuyệt vọng. (Rất nguy hiểm.)",
              20, 0, -50, -20, false)],
            // Q23
            [("Mortgage everything left to buy distressed assets.",
              "Cầm cố những gì còn lại để mua tài sản ngộp.",
              -30, 30, -20, 0, false),
             ("Regret having no capital to take advantage.",
              "Tiếc nuối vì không còn vốn để tận dụng cơ hội.",
              0, 0, -10, 0, false),
             ("Try to find co-investors to pool resources.",
              "Cố gắng tìm người mua chung.",
              5, 10, 0, 0, false)],
            // Q24
            [("Turn to religion or spirituality for meaning.",
              "Tìm đến tôn giáo và tâm linh.",
              -5, 0, 20, 0, false),
             ("Throw yourself into intense physical training.",
              "Tập luyện cường độ cao để quên nỗi đau.",
              0, 0, -10, 20, false),
             ("Isolate yourself — curtains drawn, phone off.",
              "Cô lập bản thân, chỉ ở trong phòng tối.",
              0, 0, -30, -20, false)],
            // Q25
            [("Believe it — and start accumulating stocks again.",
              "Tin tưởng và bắt đầu gom cổ phiếu trở lại.",
              -20, 15, 10, 0, false),
             ("Don't believe it — this could be a trap.",
              "Không tin, cho rằng đây là bẫy.",
              0, 0, 5, 0, false),
             ("Wait 3 more months to be certain.",
              "Chờ thêm 3 tháng nữa cho chắc chắn.",
              0, 5, 0, 0, false)],
            // Q26
            [("Join — desperation overrides judgment.",
              "Tham gia vì quá túng quẫn.",
              50, 20, -100, -30, false),
             ("Flat-out refuse.",
              "Từ chối thẳng thừng.",
              0, 0, 30, 0, false),
             ("Report them to the authorities.",
              "Báo cảnh sát.",
              0, 0, 10, -5, false)],
            // Q27
            [("Accept the move — reducing costs is the priority.",
              "Chấp nhận để giảm chi phí.",
              20, 0, -15, 0, false),
             ("Stay in the city at all costs to chase opportunities.",
              "Cố bám trụ ở thành phố để tìm cơ hội.",
              -15, 10, 0, -10, false),
             ("Borrow money to maintain your previous lifestyle.",
              "Vay mượn để duy trì mức sống cũ.",
              -20, 0, -30, 0, false)],
            // Q28
            [("Get the best available dental treatment.",
              "Làm loại xịn nhất.",
              -15, 0, 0, 20, false),
             ("Just extract it — fast and cheap.",
              "Nhổ bỏ cho nhanh, rẻ.",
              -5, 0, -10, -10, false),
             ("Endure the pain with over-the-counter painkillers.",
              "Chịu đau, uống thuốc giảm đau qua ngày.",
              5, 0, 0, -30, false)],
            // Q29
            [("Congratulate them and learn from their approach.",
              "Chúc mừng và học hỏi bí quyết.",
              0, 15, 5, 0, false),
             ("Feel envious and self-critical.",
              "Ganh tị, tự dằn vặt bản thân.",
              0, 0, -20, 0, false),
             ("Borrow money from them.",
              "Mượn tiền người đó.",
              20, 0, -10, 0, false)],
            // Q30 — B is game-over
            [("Treat it as expensive tuition and start again from zero.",
              "Coi đó là học phí và bắt đầu lại từ đầu.",
              0, 50, 10, 0, false),
             ("Despair — consider doing something you'll regret. (GAME OVER if Mental ≤ 0)",
              "Tuyệt vọng, định làm chuyện dại dột. (HẾT GAME nếu T ≤ 0)",
              0, 0, -50, 0, true),
             ("Open a journal and analyse every mistake you made.",
              "Mở nhật ký phân tích lại từng lỗi sai.",
              0, 40, 0, 0, false)],
            // Q31
            [("Work hard to recoup all your losses fast.",
              "Cày cuốc để lấy lại những gì đã mất.",
              20, 0, 0, -20, false),
             ("Work adequately and protect time for your health.",
              "Chỉ làm vừa đủ, dành thời gian cho sức khỏe.",
              5, 0, 10, 20, false),
             ("Automatically invest 50% of each paycheck.",
              "Trích 50% lương đầu tư đều đặn mỗi tháng.",
              -10, 15, 0, 0, false)],
            // Q32
            [("Sell immediately to break even and feel safe.",
              "Bán ngay để 'về bờ'.",
              20, -10, 0, 0, false),
             ("Hold — let the profits compound.",
              "Tiếp tục gồng lãi.",
              0, 10, 5, 0, false),
             ("Take profit on half, keep the other half invested.",
              "Chốt lời một nửa, giữ lại một nửa.",
              10, 0, 10, 0, false)],
            // Q33
            [("Buy your parents a thoughtful gift.",
              "Mua cho bố mẹ một món quà.",
              -10, 0, 30, 0, false),
             ("Add the full amount to your investment account.",
              "Nạp hết vào tài khoản chứng khoán.",
              -10, 10, 0, 0, false),
             ("Book a full health checkup — you've earned it.",
              "Đi khám sức khỏe tổng quát sau đợt khủng hoảng.",
              -10, 0, 0, 30, false)],
            // Q34
            [("Borrow more to ride the wave.",
              "Vay thêm tiền để lướt sóng.",
              -30, 20, -15, 0, false),
             ("Sell the distressed land you bought earlier — take the profit.",
              "Bán mảnh đất 'ngộp' mua lúc trước.",
              60, 0, 10, 0, false),
             ("Hold on and wait for prices to rise further.",
              "Giữ lại chờ tăng giá thêm.",
              0, 10, 5, 0, false)],
            // Q35
            [("Share your hard-won lessons openly.",
              "Chia sẻ kinh nghiệm xương máu.",
              0, 20, 10, 0, false),
             ("Subtly brag about your recovery.",
              "Khoe khoang về sự hồi phục của mình.",
              0, -10, 5, 0, false),
             ("Avoid them — you still feel embarrassed.",
              "Tránh mặt vì vẫn còn mặc cảm.",
              0, 0, -10, 0, false)],
            // Q36
            [("Immediately apply the AI platform to your investments.",
              "Áp dụng ngay công nghệ vào đầu tư.",
              -10, 30, 0, 0, false),
             ("Stay skeptical — trust human judgment over algorithms.",
              "Hoài nghi, tin vào bản năng con người hơn.",
              0, 5, 5, 0, false),
             ("Dedicate time to learning how AI investing works.",
              "Dành thời gian học cách dùng AI trong đầu tư.",
              0, 20, 0, -10, false)],
            // Q37
            [("Accept the pressure in exchange for higher income.",
              "Chấp nhận áp lực để có thu nhập cao.",
              30, 0, -10, -30, false),
             ("Decline to preserve your peace of mind and health.",
              "Từ chối để giữ sự bình yên và sức khỏe.",
              0, 0, 20, 10, false),
             ("Accept, but hire a capable assistant to handle the load.",
              "Nhận việc nhưng thuê trợ lý hỗ trợ.",
              10, 10, 0, 5, false)],
            // Q38
            [("Register for a marathon to push your limits.",
              "Đăng ký giải chạy Marathon.",
              -5, 0, 10, 30, false),
             ("Overhaul your diet completely — healthy eating as a discipline.",
              "Thay đổi chế độ ăn uống lành mạnh hoàn toàn.",
              -5, 0, 0, 20, false),
             ("Maintain gentle daily walks — sustainable and consistent.",
              "Chỉ duy trì đi bộ nhẹ nhàng hàng ngày.",
              0, 0, 0, 10, false)],
            // Q39
            [("Join in a little — just for the experience.",
              "Tham gia một ít cho vui.",
              -10, 5, 0, 0, false),
             ("Warn others and stand firmly on the sidelines.",
              "Cảnh báo mọi người và đứng ngoài.",
              0, 15, 10, 0, false),
             ("Publicly criticise everyone chasing the trend.",
              "Chửi bới những kẻ tham gia.",
              0, 0, -10, 0, false)],
            // Q40
            [("Withdraw everything and retire early — if capital allows.",
              "Rút hết nghỉ hưu sớm nếu đủ vốn.",
              0, -20, 30, 0, false),
             ("Keep fighting — with a new, wiser mindset.",
              "Tiếp tục chiến đấu với tâm thế mới.",
              0, 20, 10, 0, false),
             ("Move to a conservative portfolio — bonds and savings.",
              "Chuyển sang danh mục an toàn: trái phiếu và tiết kiệm.",
              0, -10, 10, 0, false)],
            // Q41
            [("Guide them wholeheartedly — share everything you know.",
              "Tận tình hướng dẫn — chia sẻ mọi thứ bạn biết.",
              0, 20, 10, 0, false),
             ("Charge a consulting fee for your time and expertise.",
              "Thu phí tư vấn cho thời gian và chuyên môn.",
              10, 5, 0, 0, false),
             ("Decline — you don't want the responsibility.",
              "Từ chối vì không muốn chịu trách nhiệm.",
              0, 0, 5, 0, false)],
            // Q42
            [("Dedicate time to writing every night.",
              "Dành thời gian viết mỗi đêm.",
              0, 30, 10, -20, false),
             ("Hire a ghostwriter to do it for you.",
              "Thuê người viết hộ.",
              -15, 10, 0, 0, false),
             ("Just share your thoughts on personal social media.",
              "Chỉ chia sẻ trên mạng xã hội cá nhân.",
              0, 5, 5, 0, false)],
            // Q43
            [("You already have a response plan ready — execute it.",
              "Đã chuẩn bị sẵn kịch bản ứng phó — thực hiện ngay.",
              0, 30, 20, 0, false),
             ("You still feel as anxious as the first time.",
              "Vẫn thấy lo lắng như lần đầu.",
              0, 0, -10, 0, false),
             ("Immediately sell all assets as a defensive move.",
              "Bán sạch tài sản ngay lập tức để phòng thủ.",
              20, -10, 0, 0, false)],
            // Q44
            [("Go — money is only a tool and family time is irreplaceable.",
              "Đi ngay — tiền bạc chỉ là công cụ và thời gian gia đình là vô giá.",
              -40, 0, 50, 20, false),
             ("Go for a short, budget-friendly trip instead.",
              "Đi ngắn ngày tiết kiệm.",
              -15, 0, 20, 0, false),
             ("Postpone — business focus comes first.",
              "Hoãn lại để tập trung làm ăn.",
              15, 0, -20, 0, false)],
            // Q45
            [("Calculate it precisely and pull the trigger now.",
              "Tính toán chi li và thực hiện ngay.",
              0, -20, 40, 0, false),
             ("Still afraid of shortfalls — work 5 more years.",
              "Vẫn sợ thiếu hụt nên làm thêm 5 năm nữa.",
              30, 0, 0, -20, false),
             ("Go semi-retired — part-time work, full-time life.",
              "Chỉ nghỉ hưu một nửa — làm bán thời gian, sống toàn thời gian.",
              10, 0, 15, 10, false)],
            // Q46
            [("Book laser eye surgery.",
              "Đi phẫu thuật mắt.",
              -20, 0, 0, 40, false),
             ("Cut screen time by switching to long-term passive investing.",
              "Hạn chế nhìn màn hình bằng cách chuyển sang đầu tư dài hạn thụ động.",
              0, 20, 0, 10, false),
             ("Wear glasses and keep working as before.",
              "Đeo kính và tiếp tục như cũ.",
              0, 0, 0, -10, false)],
            // Q47
            [("Forgive and let it go completely.",
              "Tha thứ và bỏ qua hoàn toàn.",
              0, 0, 50, 0, false),
             ("Sue them to recover what was taken.",
              "Kiện cáo đòi lại công bằng.",
              -15, 10, -30, 0, false),
             ("Act as if you don't recognise them.",
              "Coi như không quen biết.",
              0, 0, 10, 0, false)],
            // Q48
            [("Donate a large sum to a cause you believe in.",
              "Quyên góp số tiền lớn cho tổ chức bạn tin.",
              -30, 0, 60, 0, false),
             ("Establish a small scholarship fund.",
              "Lập một quỹ khuyến học nhỏ.",
              -15, 10, 40, 0, false),
             ("Help people in your immediate circle.",
              "Chỉ giúp đỡ người quen.",
              -5, 0, 10, 0, false)],
            // Q49
            [("Content — the lines are experience, not age.",
              "Hài lòng — những nếp nhăn là kinh nghiệm, không phải tuổi tác.",
              0, 10, 20, 0, false),
             ("Regret being so hard on yourself through it all.",
              "Hối hận vì đã quá khắt khe với bản thân.",
              0, 0, -20, 10, false),
             ("Nothing — it was just a game.",
              "Không cảm thấy gì — chỉ là một cuộc chơi.",
              0, 10, 0, 0, false)],
            // Q50 — all answers end the story
            [("Having a lot of money in the account. (Ending: Capital)",
              "Có rất nhiều tiền trong tài khoản. (Kết thúc: Vốn)",
              0, 0, 0, 0, true),
             ("Having an iron will and wisdom. (Ending: Experience & Mental)",
              "Có tinh thần thép và sự minh triết. (Kết thúc: Kinh nghiệm & Tinh thần)",
              0, 0, 0, 0, true),
             ("Having health and a peaceful family. (Ending: Health & Mental)",
              "Có sức khỏe và gia đình bình an. (Kết thúc: Sức khỏe & Tinh thần)",
              0, 0, 0, 0, true)],
        };

        // ── Build node objects ────────────────────────────────────────────────
        var nodes = nodeDefs.Select((def, i) => new StoryNode
        {
            Question            = def.Q,
            QuestionSubtitle    = def.Sub,
            QuestionVi          = def.QVi,
            QuestionSubtitleVi  = def.SubVi,
            IsStart             = i == 0,
            BackgroundColor     = def.Bg,
            AnimationType       = def.Anim,
            SortOrder           = i,
        }).ToList();

        var answerColors = new[] { "#059669", "#2563eb", "#f59e0b" };

        for (int i = 0; i < nodes.Count; i++)
        {
            var defs    = answerDefs[i];
            var nextNode = i < nodes.Count - 1 ? nodes[i + 1] : null;

            nodes[i].Answers = defs.Select((a, j) =>
            {
                var deltas = BuildDeltas(a.V, a.K, a.T, a.S);
                return new StoryNodeAnswer
                {
                    Text           = a.En,
                    TextVi         = a.Vi,
                    PointsAwarded  = deltas.Values.Where(v => v > 0).Sum(),
                    ScoreDeltas    = deltas,
                    NextNode       = a.End ? null : nextNode,
                    Color          = answerColors[j % answerColors.Length],
                    SortOrder      = j,
                };
            }).ToList();
        }

        // ── Find the Investment category's MaxScoreType (capital) ─────────────
        var capitalScoreType = await db.CategoryScoreTypes
            .FirstOrDefaultAsync(st => st.CategoryId == investCat.Id && st.Name == "capital");

        // ── Assemble story ────────────────────────────────────────────────────
        var story = new Story
        {
            Title       = "Investment Crisis: 50 Choices That Define You",
            Slug        = StorySlug,
            Description = "Oil at $120, inflation spiraling, markets crashing — a 50-question interactive journey through two years of economic crisis. "
                        + "Every choice shapes your Capital, Experience, Mental health, and Physical health. Will you survive — and who will you be when it's over?",
            Excerpt     = "Fifty decisions. Two years of crisis. One chance to find out who you really are.",
            CoverImageUrl = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80",
            AuthorName  = "System",
            IsFeatured  = true,
            CategoryId  = investCat.Id,
            StoryType   = "Interactive",
            IsPublish   = true,
            PublishDate = now,
            Status      = StoryStatus.Published,
            CreatedOn   = now,
            CreatedBy   = by,
            MaxScoreTypeId = capitalScoreType?.Id,
            MaxScoreValue  = null, // no early-termination based on capital
            Translations = new List<StoryTranslation>
            {
                new()
                {
                    Language    = "en",
                    Title       = "Investment Crisis: 50 Choices That Define You",
                    Description = "Oil at $120, inflation spiraling, markets crashing — a 50-question interactive journey through two years of economic crisis. "
                                + "Every choice shapes your Capital, Experience, Mental health, and Physical health. Will you survive — and who will you be when it's over?",
                    Excerpt     = "Fifty decisions. Two years of crisis. One chance to find out who you really are.",
                    CreatedOn   = now,
                    CreatedBy   = by,
                },
                new()
                {
                    Language    = "vi",
                    Title       = "Bão Đầu Tư: 50 Quyết Định Định Hình Con Người Bạn",
                    Description = "Dầu 120 USD, lạm phát leo thang, thị trường sụp đổ — hành trình 50 câu hỏi tương tác qua hai năm khủng hoảng kinh tế. "
                                + "Mỗi lựa chọn định hình Vốn (V), Kinh nghiệm (K), Tinh thần (T) và Sức khỏe (S) của bạn. Bạn có tồn tại được không — và bạn sẽ là ai khi tất cả qua đi?",
                    Excerpt     = "Năm mươi quyết định. Hai năm khủng hoảng. Một cơ hội để biết bạn thực sự là ai.",
                    CreatedOn   = now,
                    CreatedBy   = by,
                },
            },
            StoryDetails = new List<StoryDetail>
            {
                new()
                {
                    Revision    = 1,
                    IsPublish   = true,
                    SavePath    = "stories/investment/investment-crisis-50-choices.json",
                    Content     = null,
                    WordCount   = 0,
                    ScoreWeight = 1.4m,
                    CreatedOn   = now,
                    CreatedBy   = by,
                    StoryNodes  = nodes,
                },
            },
        };

        db.Stories.Add(story);
        await db.SaveChangesAsync();
    }

    private static Dictionary<string, int> BuildDeltas(int v, int k, int t, int s)
    {
        var d = new Dictionary<string, int>();
        if (v != 0) d["capital"]    = v;
        if (k != 0) d["experience"] = k;
        if (t != 0) d["mental"]     = t;
        if (s != 0) d["health"]     = s;
        return d;
    }
}
