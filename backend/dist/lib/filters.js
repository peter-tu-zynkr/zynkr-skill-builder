export function filterSkills(skills, filters) {
    return skills.filter((skill) => {
        if (filters.category && filters.category !== "all" && skill.category !== filters.category) {
            return false;
        }
        if (filters.status && skill.status !== filters.status) {
            return false;
        }
        if (filters.platform && skill.platform !== filters.platform) {
            return false;
        }
        if (filters.q) {
            const query = filters.q.toLowerCase();
            const haystack = [skill.id, skill.name, skill.description, skill.category, skill.author]
                .join(" ")
                .toLowerCase();
            if (!haystack.includes(query)) {
                return false;
            }
        }
        return true;
    });
}
